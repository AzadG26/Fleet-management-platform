import { prisma } from '../config/db.js';
import { isPointInCircle } from '../utils/haversine.js';
import { createAlert } from './alertService.js';

export const checkGeofenceViolations = async (vehicle, telemetry) => {
  try {
    const assigned = await prisma.geofenceVehicle.findMany({
      where: { vehicleId: vehicle.id, isActive: true },
      include: { geofence: true }
    });

    for (const gv of assigned) {
      const gf = gv.geofence;
      if (!gf || !gf.isActive) continue;
      const inside = isPointInCircle(telemetry.latitude, telemetry.longitude, gf.latitude, gf.longitude, gf.radius);
      if (gf.geofenceType === 'INCLUSION' && !inside) {
        // vehicle left required area
        await createGeofenceAlert(gf, vehicle, telemetry, 'EXIT');
      } else if (gf.geofenceType === 'EXCLUSION' && inside) {
        await createGeofenceAlert(gf, vehicle, telemetry, 'ENTRY');
      } else if (gf.geofenceType === 'REVERSE') {
        // If current time is within required window and the vehicle is not inside -> alert
        if (gf.requiredStartTime && gf.requiredEndTime) {
          if (isTimeInRange(new Date(), gf.requiredStartTime, gf.requiredEndTime, gf.applicableDays)) {
            if (!inside) {
              await createGeofenceAlert(gf, vehicle, telemetry, 'REVERSE_BREACH');
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Geofence check error', err.message);
  }
};

const createGeofenceAlert = async (geofence, vehicle, telemetry, type) => {
  // Avoid spamming: check last 5 minutes
  const recent = await prisma.geofenceAlert.findFirst({
    where: {
      geofenceId: geofence.id,
      vehicleId: vehicle.id,
      alertType: type,
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
    }
  });
  if (recent) return null;

  await prisma.geofenceAlert.create({
    data: {
      geofenceId: geofence.id,
      vehicleId: vehicle.id,
      alertType: type,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      description: `${type} detected for geofence ${geofence.name}`
    }
  });

  await createAlert(vehicle.userId, vehicle.id, 'GEOFENCE_BREACH', 'HIGH', `Geofence alert: ${geofence.name}`, `Type: ${type}`, { geofenceId: geofence.id, type });
};

const isTimeInRange = (current, startStr, endStr, applicableDays) => {
  try {
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const nowMin = current.getHours() * 60 + current.getMinutes();
    if (applicableDays && Array.isArray(applicableDays) && applicableDays.length > 0) {
      const dow = current.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
      if (!applicableDays.includes(dow)) return false;
    }
    return nowMin >= startMinutes && nowMin <= endMinutes;
  } catch (err) {
    return false;
  }
};

export const createGeofence = async (data) => {
  return prisma.geofence.create({ data });
};

export const assignGeofenceToVehicle = async (geofenceId, vehicleId) => {
  return prisma.geofenceVehicle.create({ data: { geofenceId, vehicleId } });
};