const prisma = require('../prismaClient');
async function checkReverseGeofence(vehicle, telemetry) {
  // Example: find geofences that have 'targetTime' in metadata stored in polygon or additional table
  // Simplified: not implementing complex reverse-geofence here. Placeholder to illustrate.
  // If vehicle has assigned targets and missed ETA -> create GeofenceAlert and call notification placeholder.
  // place a console log to show flow
  // In production: compute ETA by average speed and poly bounding boxes.
  return;
}

module.exports = { checkReverseGeofence };
