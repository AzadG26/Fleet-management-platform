const express = require('express');
const prisma = require('../prismaClient');
const { processTelemetry } = require('../services/telemetryProcessor');
const router = express.Router();

// Ingest raw telemetry (also used by vendorPoller to save)
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    // expected fields: imei, lat, lon, speed, ignition, motion, totalDistance, todayDistance, timestamp, attributes
    if (!payload.imei || !payload.timestamp) return res.status(400).send('imei+timestamp required');
    // find vehicle
    const vehicle = await prisma.vehicle.findUnique({ where: { imei: payload.imei }});
    if (!vehicle) return res.status(404).send('vehicle not found: register first');
    const t = await prisma.telemetry.create({
      data: {
        vehicleId: vehicle.id,
        rawPayload: payload,
        lat: parseFloat(payload.lat),
        lon: parseFloat(payload.lon),
        speed: parseFloat(payload.speed||0),
        ignition: !!payload.ignition,
        motion: !!payload.motion,
        totalDistance: parseFloat(payload.totalDistance||0),
        todayDistance: parseFloat(payload.todayDistance||0),
        timestamp: new Date(payload.timestamp)
      }
    });
    // process telemetry (trips, stops, fuel)
    await processTelemetry(t, vehicle);
    res.json({ ok: true, telemetryId: t.id });
  } catch (err) {
    console.error(err);
    res.status(500).send('server error');
  }
});

module.exports = router;
