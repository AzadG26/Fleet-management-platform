import { prisma } from '../config/db.js';

// Create tyre installation record and TyreHistory
export const installTyre = async (vehicleId, tyreUid, data) => {
  const tyre = await prisma.tyre.create({
    data: {
      vehicleId,
      tyreUid,
      make: data.make,
      model: data.model,
      size: data.size,
      installDate: new Date(data.installDate),
      installOdometer: data.installOdometer,
      isActive: true
    }
  });

  await prisma.tyreHistory.create({
    data: {
      tyreId: tyre.id,
      eventType: 'INSTALLATION',
      description: data.description || 'Tyre installed',
      odometer: data.installOdometer
    }
  });

  return tyre;
};

export const removeTyre = async (tyreId, data) => {
  const tyre = await prisma.tyre.update({
    where: { id: tyreId },
    data: {
      isActive: false,
      removeDate: new Date(data.removeDate),
      removeOdometer: data.removeOdometer
    }
  });

  await prisma.tyreHistory.create({
    data: {
      tyreId,
      eventType: 'REMOVAL',
      description: data.description || 'Tyre removed',
      odometer: data.removeOdometer
    }
  });

  return tyre;
};

export const swapTyres = async (fromTyreId, toVehicleId, data) => {
  const fromTyre = await prisma.tyre.findUnique({ where: { id: fromTyreId } });
  if (!fromTyre) throw new Error('Tyre not found');

  // Mark old record removed
  await prisma.tyre.update({
    where: { id: fromTyreId },
    data: { isActive: false, lastSwapDate: new Date(), swappedWith: data.toTyreUid || null }
  });

  // Create new tyre entry on target vehicle using same UID
  const newTyre = await prisma.tyre.create({
    data: {
      vehicleId: toVehicleId,
      tyreUid: fromTyre.tyreUid,
      make: fromTyre.make,
      model: fromTyre.model,
      size: fromTyre.size,
      installDate: new Date(),
      installOdometer: data.installOdometer || 0,
      isActive: true
    }
  });

  await prisma.tyreHistory.createMany({
    data: [
      { tyreId: fromTyreId, eventType: 'SWAP', description: `Swapped out to vehicle ${toVehicleId}`, odometer: data.installOdometer },
      { tyreId: newTyre.id, eventType: 'SWAP', description: `Swapped in from tyre ${fromTyreId}`, odometer: data.installOdometer }
    ]
  });

  return newTyre;
};