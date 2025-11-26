import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Documents() {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    const load = async () => {
      const vres = await api.get('/api/vehicles');
      const vehicle = vres.data.data?.[0];
      if (!vehicle) return;
      const res = await api.get(`/api/documents/${vehicle.id}`);
      setDocs(res.data.data || []);
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Documents</h1>
      <div className="grid gap-4">
        {docs.map(d => (
          <div key={d.id} className="bg-white p-4 rounded shadow">
            <div className="font-semibold">{d.documentType} — {d.documentNumber}</div>
            <div>Expiry: {new Date(d.expiryDate).toLocaleDateString()}</div>
            <div>Expired: {d.isExpired ? 'Yes' : 'No'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}