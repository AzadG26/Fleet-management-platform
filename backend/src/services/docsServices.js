const prisma = require('../prismaClient');
const dayjs = require('dayjs');

function scheduleDocumentExpiry(){
  // run once every 24 hours: check for upcoming expiries and create alerts
  setInterval(async () => {
    const now = dayjs();
    const warnWindow = now.add(30, 'day').toDate();
    const docs = await prisma.vehicleDocuments.findMany({
      where: {
        OR: [
          { rcExpires: { lte: warnWindow, gte: now.toDate() } },
          { insuranceExpires: { lte: warnWindow, gte: now.toDate() } },
          { pucExpires: { lte: warnWindow, gte: now.toDate() } }
        ]
      },
      include: { vehicle: true }
    });
    for (const d of docs) {
      // create geofence alerts table is used for generic alerts
      await prisma.geofenceAlert.create({
        data: {
          geofenceId: '',
          vehicleId: d.vehicleId,
          type: 'document-expiry',
          message: `Document expiring soon for vehicle ${d.vehicleId}`
        }
      });
    }
  }, 24 * 3600 * 1000);
}

module.exports = { scheduleDocumentExpiry };
