import express from 'express';
import { prisma } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  const alerts = await prisma.alert.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  res.json({ success: true, data: alerts });
});

router.post('/ack/:id', async (req, res) => {
  const id = req.params.id;
  const updated = await prisma.alert.update({ where: { id }, data: { isAcknowledged: true, acknowledgedAt: new Date() } });
  res.json({ success: true, data: updated });
});

export default router;