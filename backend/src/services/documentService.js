import { prisma } from '../config/db.js';
import { createAlert } from './alertService.js';

export const createDocumentRecord = async (vehicleId, documentType, issueDate, expiryDate, documentNumber, details = {}) => {
  return prisma.vehicleDocument.create({
    data: {
      vehicleId,
      documentType,
      issueDate: new Date(issueDate),
      expiryDate: new Date(expiryDate),
      documentNumber,
      issuerDetails: details,
      isExpired: new Date(expiryDate) < new Date()
    }
  });
};

// Run periodic document expiry checks
export const checkDocumentExpiry = async () => {
  const alertDays = [30, 15, 7];
  const docs = await prisma.vehicleDocument.findMany({
    where: {
      expiryDate: { gte: new Date() },
      isExpired: false
    },
    include: { vehicle: { include: { user: true } } }
  });

  for (const doc of docs) {
    const daysLeft = Math.floor((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (alertDays.includes(daysLeft)) {
      // Avoid duplicate alert within 24 hours
      const exists = await prisma.alert.findFirst({
        where: {
          vehicleId: doc.vehicleId,
          alertType: 'DOCUMENT_EXPIRY',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });
      if (!exists) {
        await createAlert(doc.vehicle.userId, doc.vehicleId, 'DOCUMENT_EXPIRY', 'MEDIUM',
          `Document expiring: ${doc.documentType}`, `Expires in ${daysLeft} days`, { documentId: doc.id });
      }
    }
  }
};