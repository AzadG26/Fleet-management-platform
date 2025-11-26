import { prisma } from '../config/db.js';

// Calculates driver category using trips in last 30 days
export const calculateDriverCategory = async (vehicleId) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const trips = await prisma.trip.findMany({
      where: { vehicleId, startTime: { gte: since }, isComplete: true }
    });
    if (!trips || trips.length === 0) return 'BLUE';
    const avgSpeed = trips.reduce((s, t) => s + (t.avgSpeed || 0), 0) / trips.length;
    const harshBrakes = trips.reduce((s, t) => s + (t.harshBrakes || 0), 0) / trips.length;
    const harshAccel = trips.reduce((s, t) => s + (t.harshAccelerations || 0), 0) / trips.length;

    // Simple rules
    if (avgSpeed > 80 || harshBrakes > 3 || harshAccel > 3) return 'RED';
    if (avgSpeed >= 60 && avgSpeed <= 80 && harshBrakes <= 2 && harshAccel <= 2) return 'GREEN';
    return 'BLUE';
  } catch (err) {
    console.error('Driver category error', err.message);
    return 'BLUE';
  }
};