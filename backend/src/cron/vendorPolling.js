import axios from 'axios';
import { prisma } from '../config/db.js';
import { parseMillitrackResponse } from '../utils/vendorParser/millitrack.js';

let polling = false;

export const startVendorPolling = async () => {
  if (polling) return;
  polling = true;

  const intervalMs = Number(process.env.MILLITRACK_POLLING_INTERVAL || 15000);
  console.log(`Starting vendor polling every ${intervalMs} ms`);

  // Run immediately and then every interval
  await pollOnce();
  setInterval(pollOnce, intervalMs);
};

const pollOnce = async () => {
  try {
    const millisUrl = process.env.MILLITRACK_API_URL;
    const token = process.env.MILLITRACK_ACCESS_TOKEN;
    if (!millisUrl || !token) {
      console.warn('Millitrack credentials not configured');
      return;
    }

    // Batch IMEIs from vehicles
    const vehicles = await prisma.vehicle.findMany({ where: { imei: { not: null } } });
    if (!vehicles || vehicles.length === 0) return;

    // Millitrack supports multiple imei params. Build query safely.
    // Respect 10s minimum interval rule by using configured polling interval >= 10000
    const imeiParams = vehicles.map(v => `&imei=${encodeURIComponent(v.imei)}`).join('');
    const url = `${millisUrl}?accessToken=${encodeURIComponent(token)}${imeiParams}`;

    const res = await axios.get(url, { timeout: 10000 });
    if (res.data) {
      await parseMillitrackResponse(res.data);
    }
  } catch (err) {
    console.error('Vendor polling error', err.message);
  }
};