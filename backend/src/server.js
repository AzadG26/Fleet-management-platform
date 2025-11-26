import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { prisma } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import vehicleRoutes from "./routes/vehicles.js";
import telemetryRoutes from "./routes/telemetry.js";
import fuelRoutes from "./routes/fuel.js";
import tyreRoutes from "./routes/tyres.js";
import geofenceRoutes from "./routes/geofence.js";
import documentRoutes from "./routes/documents.js";
import alertRoutes from "./routes/alerts.js";

import { startVendorPolling } from "./cron/vendorPolling.js";
import { startDocumentAlerts } from "./cron/documentAlerts.js";
import { startGeofenceMonitoring } from "./cron/geofenceMonitoring.js";

dotenv.config();

// ---------------------------------------------
// Basic Setup
// ---------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// Railway auto-detect production
const isProduction = process.env.NODE_ENV === "production";

// Fix ES module dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------
// Middleware
// ---------------------------------------------
app.use(
  cors({
    origin: "*", 
    methods: "GET,POST,PUT,DELETE",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------
// Health Check Route (For Railway)
// ---------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Fleet Management API is running",
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------
// API Routes
// ---------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/fuel", fuelRoutes);
app.use("/api/tyres", tyreRoutes);
app.use("/api/geofence", geofenceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/alerts", alertRoutes);

// ---------------------------------------------
// Serve Static Frontend (Optional for full-stack)
// If you later add your frontend build folder inside backend
// ---------------------------------------------
const frontendPath = path.join(__dirname, "dist");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  const indexFile = path.join(frontendPath, "index.html");
  if (isProduction && res.sendFile) {
    return res.sendFile(indexFile);
  }
  res.status(404).json({ success: false, message: "Route not found" });
});

// ---------------------------------------------
// Error Handler
// ---------------------------------------------
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ success: false, message: err.message });
});

// ---------------------------------------------
// Start Server
// ---------------------------------------------
const startServer = async () => {
  try {
    // DB Check
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected");

    // Disable cron jobs on Railway if project sleeps
    if (process.env.ENABLE_VENDOR_POLLING === "true") {
      startVendorPolling();
    }
    if (process.env.ENABLE_DOCUMENT_ALERTS === "true") {
      startDocumentAlerts();
    }
    if (process.env.ENABLE_GEOFENCE_MONITORING === "true") {
      startGeofenceMonitoring();
    }

    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();

export default app;
