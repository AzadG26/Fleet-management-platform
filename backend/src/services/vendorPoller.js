const axios = require('axios');
const prisma = require('../prismaClient');
const { millitrackParser } = require('./parsers/millitrackParser');

const MILLITRACK_BASE = process.env.MILLITRACK_BASE || 'https://mvts1.millitrack.com/api/middleMan/getDeviceInfo';
const MILLITRACK_TOKEN = process.env.MILLITRACK_TOKEN || '';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '10000', 10); // 10 sec

let lastPoll = 0;

async function pollMillitrack() {
  try {
    const imeis = (await prisma.vehicle.findMany({ select: { imei: true } })).map(v => v.imei).filter(Boolean);
    if (imeis.length === 0) return;
    const imeiQuery = imeis.map(i=>`&imei=${i}`).join('');
    const url = `${MILLITRACK_BASE}?accessToken=${MILLITRACK_TOKEN}${imeiQuery}`;
    const resp = await axios.get(url, { timeout: 8000 });
    // respect vendor rate-limit: we poll every 10s; do not hammer
    if (!resp.data) return;
    const devices = resp.data.data || resp.data; // defensive
    for (const d of devices) {
      const parsed = millitrackParser(d);
      // upsert vehicle
      const vehicle = await prisma.vehicle.findUnique({ where: { imei: parsed.imei }});
      if (!vehicle) {
        console.warn('Skipping unknown IMEI from Millitrack:', parsed.imei);
        continue;
      }
      // post to telemetry API endpoint logic: save directly
      await prisma.telemetry.create({
        data: {
          vehicleId: vehicle.id,
          rawPayload: d,
          lat: parsed.lat,
          lon: parsed.lon,
          speed: parsed.speed,
          ignition: parsed.ignition,
          motion: parsed.motion,
          totalDistance: parsed.totalDistance,
          todayDistance: parsed.todayDistance,
          timestamp: parsed.timestamp
        }
      }).then(t => {
        // lightweight processing fire & forget
        const { processTelemetry } = require('./telemetryProcessor');
        processTelemetry(t, vehicle).catch(e => console.error('procTelemetry err', e));
      });
    }
  } catch (err) {
    console.error('vendorPoller error', err.message || err);
  }
}

function startVendorPoller() {
  console.log('Starting vendor poller (10s) ...');
  setInterval(() => {
    pollMillitrack();
  }, POLL_INTERVAL_MS);
}

module.exports = { startVendorPoller, pollMillitrack };
