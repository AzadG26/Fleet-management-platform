import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createDocumentRecord } from '../services/documentService.js';
import { prisma } from '../config/db.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', async (req, res) => {
  try {
    const { vehicleId, documentType, issueDate, expiryDate, documentNumber, details } = req.body;
    if (!vehicleId || !documentType || !expiryDate) return res.status(400).json({ success: false, message: 'vehicleId, documentType and expiryDate required' });
    const doc = await createDocumentRecord(vehicleId, documentType, issueDate, expiryDate, documentNumber, details);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:vehicleId', async (req, res) => {
  const docs = await prisma.vehicleDocument.findMany({ where: { vehicleId: req.params.vehicleId }, orderBy: { expiryDate: 'asc' } });
  res.json({ success: true, data: docs });
});

export default router;