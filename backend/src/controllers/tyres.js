import express from 'express';
import { prisma } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { installTyre, removeTyre, swapTyres } from '../services/tyreService.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/install', async (req, res) => {
  try {
    const { vehicleId, tyreUid, make, model, size, installDate, installOdometer } = req.body;
    if (!vehicleId || !tyreUid) return res.status(400).json({ success: false, message: 'vehicleId and tyreUid required' });
    const tyre = await installTyre(vehicleId, tyreUid, { make, model, size, installDate, installOdometer });
    res.json({ success: true, data: tyre });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/remove', async (req, res) => {
  try {
    const { tyreId, removeDate, removeOdometer } = req.body;
    if (!tyreId) return res.status(400).json({ success: false, message: 'tyreId required' });
    const tyre = await removeTyre(tyreId, { removeDate, removeOdometer });
    res.json({ success: true, data: tyre });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/swap', async (req, res) => {
  try {
    const { fromTyreId, toVehicleId, installOdometer } = req.body;
    const newTyre = await swapTyres(fromTyreId, toVehicleId, { installOdometer });
    res.json({ success: true, data: newTyre });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  const tyres = await prisma.tyre.findMany();
  res.json({ success: true, data: tyres });
});

router.get('/history/:tyreId', async (req, res) => {
  const history = await prisma.tyreHistory.findMany({ where: { tyreId: req.params.tyreId }, orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: history });
});

export default router;