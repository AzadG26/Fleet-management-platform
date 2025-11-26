import { prisma } from '../config/db.js';
import { checkGeofenceViolations } from '../services/geofenceService.js';

// This runner will check last telemetry for vehicles and run geofence checks
export const startGeofenceMonitoring = () => {
  const interval = Number(process.env.GEOFENCE_CHECK_INTERVAL || 60000);
  console.log(`Geofence monitoring started every ${interval} ms`);
  runCheck();
  setInterval(runCheck, interval);
};

const runCheck = async () => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    for (const v of vehicles) {
      // get last telemetry
      const tel = await prisma.telemetry.findFirst({
        where: { vehicleId: v.id },
        orderBy: { recordedAt: 'desc' }
      });
      if (tel) {
        await checkGeofenceViolations(v, tel);
      }
    }
  } catch (err) {
    console.error('Geofence monitoring error', err.message);
  }
};