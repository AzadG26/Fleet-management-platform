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

// -----------------------------------------------------
// Setup
// -----------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ES module path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------
// Middleware
// -----------------------------------------------------
app.use(
  cors({
    origin: "*",
    methods: "GET, POST, PUT, DELETE",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------
// Health Check (Railway uses this)
// -----------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Fleet API is running",
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// -----------------------------------------------------
// API Routes
// -----------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/fuel", fuelRoutes);
app.use("/api/tyres", tyreRoutes);
app.use("/api/geofence", geofenceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/alerts", alertRoutes);

// -----------------------------------------------------
// Serve Frontend Build (for Railway full-stack deployment)
// -----------------------------------------------------
const frontendPath = path.join(__dirname, "../../frontend/dist");

if (NODE_ENV === "production") {
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// -----------------------------------------------------
// Error Handler
// -----------------------------------------------------
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ success: false, message: err.message });
});

// -----------------------------------------------------
// Start Server
// -----------------------------------------------------
const startServer = async () => {
  try {
    // Prisma DB connectivity check
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected");

    // Cron jobs only if enabled
    if (process.env.ENABLE_VENDOR_POLLING === "true") startVendorPolling();
    if (process.env.ENABLE_DOCUMENT_ALERTS === "true") startDocumentAlerts();
    if (process.env.ENABLE_GEOFENCE_MONITORING === "true") startGeofenceMonitoring();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();

export default app;
