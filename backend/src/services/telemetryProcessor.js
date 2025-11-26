const prisma = require('../prismaClient');
const { haversine } = require('../utils/haversine');
const { analyzeFuel } = require('./fuelEngine');

async function processTelemetry(telemetryRecord, vehicle) {
  // telemetryRecord is Prisma Telemetry instance with fields set
  // 1) Save is already done where called.
  // 2) Link with previous telemetry to detect trips/stops/idle
  const last = await prisma.telemetry.findFirst({
    where: { vehicleId: vehicle.id, id: { not: telemetryRecord.id } },
    orderBy: { timestamp: 'desc' }
  });

  if (!last) {
    // first point
    return;
  }

  const distKm = haversine(last.lat, last.lon, telemetryRecord.lat, telemetryRecord.lon);
  const dtSec = (telemetryRecord.timestamp - last.timestamp) / 1000;
  const speedAvg = dtSec > 0 ? (distKm / (dtSec / 3600)) : telemetryRecord.speed;

  // naive stop detection
  if (telemetryRecord.speed < 2 && last.speed < 2) {
    // possible stop: create stop record / update trip
    // For brevity, skipping trip DB model, but here you would extend
  }

  // fuel analysis
  await analyzeFuel(vehicle, last, telemetryRecord, distKm);

  // reverse geofence checks (call engine)
  const { checkReverseGeofence } = require('./geofenceEngine');
  checkReverseGeofence(vehicle, telemetryRecord).catch(e => console.error('geofence err', e));
}

module.exports = { processTelemetry };
