import { prisma } from '../config/db.js';

// Generic create alert; stores alert in DB. Placeholder for sending notifications.
export const createAlert = async (userId, vehicleId, alertType, severity, title, message, details = {}) => {
  try {
    // Save to DB for later consumption
    const alert = await prisma.alert.create({
      data: {
        userId,
        vehicleId,
        alertType,
        severity,
        title,
        message,
        details,
        triggerData: details
      }
    });

    // Placeholder: send notifications (email/SMS/push)
    // sendNotification(userId, alert);

    return alert;
  } catch (err) {
    console.error('Failed to create alert', err.message);
    return null;
  }
};