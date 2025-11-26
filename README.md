```markdown
# Fleet Management & Telematics Integration Platform

A full-featured Fleet Management & Telematics Integration Platform with multi-vendor GPS support (including Millitrack), real-time tracking, telemetry ingestion, fuel monitoring and theft detection, tyre tracking, reverse geofencing, document expiry alerts, driver categorization, trip computation and analytics.

This repository contains a complete backend (Node.js, Express, Prisma, PostgreSQL) and frontend (Vite, React, TailwindCSS) implementation.

---

## Contents

- backend/ — Node.js backend with Prisma
- frontend/ — React + Vite frontend
- docker-compose.yml — PostgreSQL + Adminer
- README.md — this file

---

## Quick Start (Development)

Requirements:
- Node.js 18+
- Docker & Docker Compose (for database) or a running PostgreSQL instance
- npm or yarn

1. Start database with Docker Compose:
```bash
docker-compose up -d
```

2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env to match credentials (DATABASE_URL may be left as-is when using docker-compose)
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

By default:
- Backend API: http://localhost:5000
- Frontend: http://localhost:5173
- Adminer: http://localhost:8080 (DB: postgres, user/password/database from docker-compose)

---

## Backend Overview

Main features:
- JWT authentication (signup/login)
- POST /api/telemetry — unified ingestion endpoint for vendor or device telemetry
- Millitrack vendor polling with 10s+ interval rule
- Vehicle CRUD, Tyre CRUD + swap detection, Fuel logs, Document expiry checks
- Driver categorization (GREEN / BLUE / RED)
- Reverse geofence alerts (vehicle NOT present during required time)
- Trip calculation (distance, stops, idle times)
- Cron jobs for vendor polling, document expiry checks, geofence monitoring

Key folders:
- src/controllers — Express controllers (auth, vehicles, telemetry, fuel, tyres, geofence, documents, alerts)
- src/routes — routes wiring
- src/services — business logic (telemetryService, fuelService, geofenceService, tyreService, documentService, alertService, driverService)
- src/utils — haversine, jwt helpers, vendor parsers
- src/cron — scheduled tasks (vendorPolling, documentAlerts, geofenceMonitoring)

---

## Millitrack Integration

- Endpoint used:
  https://mvts1.millitrack.com/api/middleMan/getDeviceInfo?accessToken={TOKEN}&imei={IMEI1}&imei={IMEI2}

- Rules respected:
  - Wait at least 10 seconds between API calls
  - Polling interval configurable via MILLITRACK_POLLING_INTERVAL (ms) in backend `.env`
  - Converts GMT timestamps from Millitrack to IST (+05:30)
  - Parses and stores raw JSON and interpreted telemetry fields
  - Auto-creates vehicle record based on deviceUniqueId (IMEI) if not present
  - Converts meters→km for distance tracking
  - Detects stops (speed = 0 && ignition = true), idling (speed=0 && ignition=true && motion=false), overspeeding (speed>vehicle.maxSpeed)
  - Calls fuel theft detection when fuel logs exist

---

## Database (Prisma)

The Prisma schema is in `backend/prisma/schema.prisma`. Primary models:

- User
- Vehicle
- Telemetry
- FuelLog
- Tyre, TyreHistory
- Geofence, GeofenceVehicle, GeofenceAlert
- VehicleDocument
- Trip
- Alert

The schema includes fields for tyre UID, installation/removal dates, document expiry dates (RC, Insurance, PUC, Fitness, Permit, Tax), raw telemetry JSON, totalDistance and todayDistance for vehicles, fuel logs with kmpl, etc.

---

## Frontend Overview

- Login screen
- Dashboard showing vehicle list and last-known telemetry (location, speed, ignition, motion)
- Vehicle card shows status color (moving/idle/stopped/offline)
- Pages:
  - Dashboard
  - Geofencing (create/list geofences)
  - Fuel Reports (fetch fuel analytics)
  - Tyres (management + history)
  - Documents (expiry list)

API client uses axios and requires JWT to be set in Authorization header.

---

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.

Important backend variables:
- DATABASE_URL
- JWT_SECRET
- MILLITRACK_API_URL
- MILLITRACK_ACCESS_TOKEN
- MILLITRACK_POLLING_INTERVAL
- ALERT_FUEL_THEFT_THRESHOLD
- ALERT_OVERSPEEDING_THRESHOLD

---

## Alerts & Notifications

Alert creation functions are implemented as placeholder services that store alerts into the database. Integrations for SMS / email / push are left as extension points and example hooks are provided in `src/services/alertService.js`.

---

## Production Notes

- Use a secure JWT_SECRET and rotate regularly
- Use a production Postgres instance and backups
- Configure proper logging, monitoring, and rate-limiting
- Secure Millitrack access token and rotate if compromised
- Configure HTTPS when deploying frontend + backend

---

If you'd like, I can:
- Create a GitHub repo and populate these files for you (I will provide a .zip or Git commands)
- Add unit tests or e2e tests
- Add CI (GitHub Actions) pipelines for lint/test/deploy

```