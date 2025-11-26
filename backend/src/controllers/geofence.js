import express from 'express';
import { prisma } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { createGeofence, assignGeofenceToVehicle } from '../services/geofenceService.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', async (req, res) => {
  try {
    const gf = await createGeofence(req.body);
    res.json({ success: true, data: gf });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  const geofences = await prisma.geofence.findMany();
  res.json({ success: true, data: geofences });
});

router.post('/assign', async (req, res) => {
  try {
    const { geofenceId, vehicleId } = req.body;
    const rel = await assignGeofenceToVehicle(geofenceId, vehicleId);
    res.json({ success: true, data: rel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/alerts', async (req, res) => {
  const alerts = await prisma.geofenceAlert.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: alerts });
});

export default router;