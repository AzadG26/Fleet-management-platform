const prisma = require('../prismaClient');

// naive fuel anomaly detection based on odometer vs reported distance and fuel events (fuel logs)
async function analyzeFuel(vehicle, lastTelemetry, currentTelemetry, distKm) {
  // distKm is distance between these two points computed by haversine
  // Retrieve fuel logs close to now to analyze
  const fuelLogs = await prisma.fuelLog.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Simplified check: if distance > 0 and sudden drop in reported fuel attribute exists in rawPayload attributes
  const lastFuel = lastTelemetry.rawPayload?.attributes?.fuelLevel ?? lastTelemetry.rawPayload?.fuel ?? null;
  const curFuel = currentTelemetry.rawPayload?.attributes?.fuelLevel ?? currentTelemetry.rawPayload?.fuel ?? null;

  if (lastFuel != null && curFuel != null) {
    const fuelDelta = lastFuel - curFuel;
    // liters per 100km estimation if you know tank size: for now use relative thresholds
    if (fuelDelta > 10 && distKm < 1) {
      // suspicious: lots of fuel lost but not moved
      // Create an alert record (could be an Alerts table)
      console.log('Fuel theft suspicion for vehicle', vehicle.imei, 'fuelDelta', fuelDelta);
      // save a FuelLog with negative liters to mark theft
      await prisma.fuelLog.create({
        data: {
          vehicleId: vehicle.id,
          liters: -Math.abs(fuelDelta),
          odometer: currentTelemetry.totalDistance || 0,
          source: 'theft-detection'
        }
      });
    }
  }

  // For driver categorization, compute kmpl over recent history
  // Basic example: if km / fuel consumed < threshold mark as Green/Blue/Red.
  // Implementation left for expansion.
}

module.exports = { analyzeFuel };
