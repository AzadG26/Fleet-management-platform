import { prisma } from '../config/db.js';

// Check for suspicious fuel usage between last fuel log and now
export const checkFuelTheft = async (vehicleId, latestTelemetry) => {
  try {
    const lastFuelLog = await prisma.fuelLog.findFirst({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastFuelLog) return { suspicious: false, reason: 'No fuel logs available' };

    // Calculate distance traveled since last fuel log using telemetry totalDistance
    const distanceSinceLast = (latestTelemetry.totalDistance || 0) - (lastFuelLog.odometer || 0);
    if (distanceSinceLast <= 0) return { suspicious: false, reason: 'No forward distance since last fuel log' };

    // Estimate expected fuel used using last known kmpl or an assumed kmpl
    const assumedKmpl = 5; // default
    const expectedFuelUsed = distanceSinceLast / assumedKmpl;

    // Fuel added since the last fuel log
    const fuelAddedAgg = await prisma.fuelLog.aggregate({
      where: { vehicleId, createdAt: { gte: lastFuelLog.createdAt } },
      _sum: { fuelLitresAdded: true }
    });
    const totalAdded = fuelAddedAgg._sum.fuelLitresAdded || 0;

    const thresholdPercent = Number(process.env.ALERT_FUEL_THEFT_THRESHOLD || 15);
    if (expectedFuelUsed === 0) return { suspicious: false, reason: 'Expected fuel zero' };

    const variance = ((expectedFuelUsed - totalAdded) / expectedFuelUsed) * 100;

    if (variance > thresholdPercent) {
      return {
        suspicious: true,
        reason: `Fuel anomaly: expected ${expectedFuelUsed.toFixed(2)}L used, but only ${totalAdded.toFixed(2)}L added (${variance.toFixed(2)}% variance)`,
        details: { distanceSinceLast, expectedFuelUsed: expectedFuelUsed.toFixed(2), totalAdded: totalAdded.toFixed(2), variance: variance.toFixed(2) }
      };
    }

    return { suspicious: false, reason: 'Fuel within expected range' };
  } catch (err) {
    console.error('Fuel theft check error', err.message);
    return { suspicious: false, reason: 'Error during analysis' };
  }
};

export const calculateFuelKmpl = async (vehicleId) => {
  const logs = await prisma.fuelLog.findMany({
    where: { vehicleId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  if (logs.length < 2) return null;
  let totalDist = 0, totalFuel = 0;
  for (let i = 0; i < logs.length - 1; i++) {
    const cur = logs[i], prev = logs[i + 1];
    const dist = cur.odometer - prev.odometer;
    const fuel = cur.fuelLitresAdded;
    if (dist > 0 && fuel > 0) {
      totalDist += dist;
      totalFuel += fuel;
    }
  }
  if (totalFuel === 0) return null;
  return totalDist / totalFuel;
};