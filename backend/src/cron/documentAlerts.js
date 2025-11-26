import { checkDocumentExpiry } from '../services/documentService.js';

export const startDocumentAlerts = () => {
  const interval = 1000 * 60 * 60; // hourly
  console.log('Document alerts runner initialized (hourly)');
  checkDocumentExpiry().catch(err => console.error('documentAlerts initial error', err.message));
  setInterval(() => {
    checkDocumentExpiry().catch(err => console.error('documentAlerts error', err.message));
  }, interval);
};