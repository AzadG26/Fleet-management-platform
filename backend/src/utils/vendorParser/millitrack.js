import { prisma } from '../../config/db.js';
import { gmtToIst } from '../haversine.js';
import { handleTelemetry } from '../../services/telemetryService.js';

// Parse Millitrack API response and create telemetry records
export const parseMillitrackResponse = async (response) => {
  if (!response || !response.successful || !Array.isArray(response.object)) {
    throw new Error('Invalid Millitrack response');
  }

  const results = [];
  for (const device of response.object) {
    try {
      const record = await processDevice(device);
      results.push({ imei: device.deviceUniqueId, ok: true, telemetryId: record.id });
    } catch (err) {
      results.push({ imei: device?.deviceUniqueId || null, ok: false, error: err.message });
    }
  }
  return results;
};

const processDevice = async (deviceData) => {
  const imei = deviceData.deviceUniqueId;
  if (!imei) throw new Error('Missing imei');

  // auto-create vehicle if missing (assign to first user if exists)
  let vehicle = await prisma.vehicle.findUnique({ where: { imei } });
  if (!vehicle) {
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      throw new Error('No user exists to assign auto-created vehicle. Create a user first.');
    }
    vehicle = await prisma.vehicle.create({
      data: {
        imei,
        name: deviceData.name || `VEHICLE_${imei}`,
        registrationNumber: `TEMP_${imei}`,
        userId: defaultUser.id
      }
    });
  }

  // Build telemetry object
  const latitude = deviceData.latitude ?? 0;
  const longitude = deviceData.longitude ?? 0;
  const speed = deviceData.speed ?? 0;
  const ignition = deviceData.ignition ?? false;
  const motion = deviceData.motion ?? false;
  const charge = deviceData.charge ?? false;

  // Distances from attributes or top-level
  const attrs = deviceData.attributes || {};
  const totalDistanceMeters = attrs.totalDistance ?? deviceData.totalDistance ?? 0;
  const todayDistanceMeters = attrs.todayDistance ?? deviceData.todayDistance ?? 0;

  const totalDistanceKm = totalDistanceMeters / 1000;
  const todayDistanceKm = todayDistanceMeters / 1000;

  const deviceTime = gmtToIst(deviceData.deviceTime || deviceData.timestamp);
  const serverTime = gmtToIst(deviceData.serverTime || deviceData.timestamp);
  const fixTime = deviceData.fixTime ? gmtToIst(deviceData.fixTime) : null;

  // Create telemetry entry using centralized service for downstream processing
  const telemetry = await handleTelemetry({
    vehicleId: vehicle.id,
    latitude,
    longitude,
    altitude: deviceData.altitude ?? 0,
    speed,
    course: deviceData.course ?? 0,
    accuracy: deviceData.accuracy ?? 0,
    ignition,
    motion,
    charge,
    totalDistanceKm,
    todayDistanceKm,
    rawVendorData: deviceData,
    deviceTime,
    serverTime,
    fixTime,
    vendor: 'millitrack'
  });

  return telemetry;
};