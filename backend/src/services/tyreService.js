const prisma = require('../prismaClient');

async function installTyre(vehicleId, serial, position) {
  // mark existing tyre in same position removed
  await prisma.tyre.updateMany({
    where: { vehicleId, position, removedAt: null },
    data: { removedAt: new Date() }
  });
  const tyre = await prisma.tyre.create({
    data: { vehicleId, serial, position, installedAt: new Date() }
  });
  await prisma.tyreHistory.create({
    data: { tyreId: tyre.id, action: 'installed', notes: `Installed at ${position}` }
  });
  return tyre;
}

async function removeTyre(tyreId, notes) {
  await prisma.tyre.update({ where: { id: tyreId }, data: { removedAt: new Date() }});
  await prisma.tyreHistory.create({ data: { tyreId, action: 'removed', notes }});
}

module.exports = { installTyre, removeTyre };
