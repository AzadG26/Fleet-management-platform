import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './config/db.js';
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import telemetryRoutes from './routes/telemetry.js';
import fuelRoutes from './routes/fuel.js';
import tyreRoutes from './routes/tyres.js';
import geofenceRoutes from './routes/geofence.js';
import documentRoutes from './routes/documents.js';
import alertRoutes from './routes/alerts.js';
import { startVendorPolling } from './cron/vendorPolling.js';
import { startDocumentAlerts } from './cron/documentAlerts.js';
import { startGeofenceMonitoring } from './cron/geofenceMonitoring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Fleet Management API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/tyres', tyreRoutes);
app.use('/api/geofence', geofenceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/alerts', alertRoutes);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message });
});

const startServer = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connected');

    if (process.env.ENABLE_VENDOR_POLLING === 'true') {
      startVendorPolling();
    }
    if (process.env.ENABLE_DOCUMENT_ALERTS === 'true') {
      startDocumentAlerts();
    }
    if (process.env.ENABLE_GEOFENCE_MONITORING === 'true') {
      startGeofenceMonitoring();
    }

    app.listen(PORT, () => {
      console.log(`Fleet Management API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start', err.message);
    process.exit(1);
  }
};

startServer();

export default app;