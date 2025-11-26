const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const telemetryRoutes = require('./routes/telemetry');
const { startVendorPoller } = require('./services/vendorPoller');
const { scheduleDocumentExpiry } = require('./services/docsService');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/telemetry', telemetryRoutes);

// start background services
startVendorPoller(); // polls vendor APIs (10s)
scheduleDocumentExpiry(); // daily check

module.exports = app;
