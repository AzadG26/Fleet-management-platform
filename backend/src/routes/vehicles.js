const express = require('express');
const prisma = require('../prismaClient');
const router = express.Router();

router.get('/', async (req, res) => {
  // return vehicles with last telemetry
  const vehicles = await prisma.vehicle.findMany({
    include: { telemetries: { take: 1, orderBy: { timestamp: 'desc' } } }
  });
  const out = vehicles.map(v => ({
    id: v.id, imei: v.imei, name: v.name, plate: v.plateNumber,
    lat: v.telemetries[0]?.lat || 0,
    lon: v.telemetries[0]?.lon || 0,
    speed: v.telemetries[0]?.speed || 0,
    timestamp: v.telemetries[0]?.timestamp
  }));
  res.json(out);
});

module.exports = router;
