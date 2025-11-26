import express from 'express';
import { prisma } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({ where: { userId: req.user.id } });
  res.json({ success: true, data: vehicles });
});

router.post('/', async (req, res) => {
  const data = req.body;
  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        userId: req.user.id,
        registrationNumber: data.registrationNumber,
        name: data.name,
        model: data.model,
        make: data.make,
        year: data.year || new Date().getFullYear(),
        imei: data.imei,
        fuelTankCapacity: data.fuelTankCapacity || 200,
        maxSpeed: data.maxSpeed || 100
      }
    });
    res.json({ success: true, data: vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  res.json({ success: true, data: vehicle });
});

router.put('/:id', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;