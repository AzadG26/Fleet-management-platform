import express from 'express';
import { prisma } from '../config/db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { handleTelemetry } from '../services/telemetryService.js';

const router = express.Router();

// Unified ingestion endpoint for vendors / gateways
router.post('/', optionalAuth, async (req, res) => {
  try {
    // Depending on vendor, payload may vary. If vendor=millitrack raw response passed -> parse upstream
    // For simplicity, accept normalized payload or vendor-specific object along with vehicleId or imei
    const payload = req.body;

    // Vendor raw Millitrack object
    if (payload.vendor === 'millitrack' && payload.raw) {
      // Use vendor parser in utils instead of here. But accept normalized fields if provided.
      // For simplicity, support normalized ingestion too:
      if (payload.normalized) {
        const telemetry = await handleTelemetry(payload.normalized);
        return res.json({ success: true, data: telemetry });
      } else {
        return res.status(400).json({ success: false, message: 'millitrack raw ingestion is handled by vendor polling' });
      }
    }

    // Accept normalized ingestion: must include vehicleId
    if (!payload.vehicleId) return res.status(400).json({ success: false, message: 'vehicleId required' });
    const telemetry = await handleTelemetry(payload);
    res.json({ success: true, data: telemetry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;