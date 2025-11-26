import { prisma } from '../config/db.js';
import { haversineDistance } from '../utils/haversine.js';
import { createAlert } from './alertService.js';
import { checkFuelTheft } from './fuelService.js';
import { checkGeofenceViolations } from './geofenceService.js';
import { calculateDriverCategory } from './driverService.js';

// Centralized telemetry handler used by ingestion endpoint and vendor parsers
export const handleTelemetry = async (payload) => {
  const {
    vehicleId,
    latitude,
    longitude,
    altitude,
    speed,
    course,
    accuracy,
    ignition,
    motion,
    charge,
    totalDistanceKm,
    todayDistanceKm,
    rawVendorData,
    deviceTime,
    serverTime,
    fixTime,
    vendor
  } = payload;

  // Get last telemetry to compute deltas
  const lastTelemetry = await prisma.telemetry.findFirst({
    where: { vehicleId },
    orderBy: { recordedAt: 'desc' }
  });

  let distanceTraveled = 0;
  if (lastTelemetry) {
    try {
      distanceTraveled = haversineDistance(
        lastTelemetry.latitude,
        lastTelemetry.longitude,
        latitude,
        longitude
      );
    } catch (err) {
      distanceTraveled = 0;
    }
  }

  // Create telemetry
  const telemetry = await prisma.telemetry.create({
    data: {
      vehicleId,
      latitude,
      longitude,
      altitude,
      accuracy,
      speed,
      course,
      ignition,
      motion,
      charge,
      distanceTraveled,
      totalDistance: totalDistanceKm,
      todayDistance: todayDistanceKm,
      rawVendorData,
      vendorType: vendor,
      deviceTime,
      serverTime,
      fixTime
    }
  });

  // Update vehicle status fields
  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      currentLatitude: latitude,
      currentLongitude: longitude,
      currentSpeed: speed,
      ignitionOn: Boolean(ignition),
      moving: Boolean(motion),
      online: true,
      lastSeenAt: new Date(),
      status: deriveVehicleStatus(ignition, motion, speed),
      totalDistance: totalDistanceKm,
      todayDistance: todayDistanceKm
    }
  });

  // Business logic
  try {
    // Overspeeding
    if (speed > (vehicle.maxSpeed || Number(process.env.ALERT_OVERSPEEDING_THRESHOLD || 80))) {
      await createAlert(vehicle.userId, vehicleId, 'OVERSPEEDING', 'HIGH',
        'Vehicle overspeed detected',
        `Speed: ${speed} km/h`, { speed, maxSpeed: vehicle.maxSpeed });
    }

    // Stop detection: speed=0 & ignition=true -> STOPPED engine on
    if (speed === 0 && ignition) {
      await createAlert(vehicle.userId, vehicleId, 'VEHICLE_IDLE', 'LOW',
        'Vehicle stopped with ignition on',
        `Location: ${latitude}, ${longitude}`, {});
    }

    // Idling: speed=0 & ignition=true & motion=false
    if (speed === 0 && ignition && !motion) {
      await createAlert(vehicle.userId, vehicleId, 'ENGINE_RUNNING_IDLE', 'MEDIUM',
        'Engine running while vehicle not moving',
        `Location: ${latitude}, ${longitude}`, {});
    }

    // Fuel theft check (fires a DB/service check)
    const fuelResult = await checkFuelTheft(vehicleId, telemetry);
    if (fuelResult?.suspicious) {
      await createAlert(vehicle.userId, vehicleId, 'FUEL_THEFT', 'CRITICAL',
        'Suspicious fuel consumption detected',
        fuelResult.reason, fuelResult.details);
    }

    // Geofence checks
    await checkGeofenceViolations(vehicle, telemetry);

    // Driver category recalculation
    const driverCategory = await calculateDriverCategory(vehicleId);
    if (driverCategory && driverCategory !== vehicle.driverCategory) {
      await prisma.vehicle.update({ where: { id: vehicleId }, data: { driverCategory } });
    }
  } catch (err) {
    console.error('Telemetry business logic error', err.message);
  }

  return telemetry;
};

const deriveVehicleStatus = (ignition, motion, speed) => {
  if (ignition && motion && speed > 0) return 'MOVING';
  if (ignition && !motion && speed === 0) return 'IDLING_ENGINE_ON';
  if (!ignition && !motion && speed === 0) return 'STOPPED_ENGINE_OFF';
  return 'IDLE';
};