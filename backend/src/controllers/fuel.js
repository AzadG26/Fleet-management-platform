import express from 'express';
import { prisma } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { createFuelLog, getFuelReport } from '../services/fuelService.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/logs', async (req, res) => {
  try {
    const { vehicleId, fuelLitres, cost, location, odometer, recordedAt } = req.body;
    if (!vehicleId || fuelLitres == null || odometer == null) {
      return res.status(400).json({ success: false, message: 'vehicleId, fuelLitres and odometer required' });
    }
    const log = await prisma.fuelLog.create({
      data: {
        vehicleId,
        fuelLitresAdded: fuelLitres,
        fuelCost: cost,
        location,
        odometer,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date()
      }
    });
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/reports/:vehicleId', async (req, res) => {
  try {
    const report = await getFuelReport(req.params.vehicleId, Number(req.query.days || 30));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;