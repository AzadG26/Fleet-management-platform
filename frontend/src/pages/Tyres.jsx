import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Tyres() {
  const [tyres, setTyres] = useState([]);

  useEffect(() => {
    const load = async () => {
      const r = await api.get('/api/tyres');
      setTyres(r.data.data || []);
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Tyre Management</h1>
      <div className="grid gap-4">
        {tyres.map(t => (
          <div key={t.id} className="bg-white p-4 rounded shadow">
            <div className="font-semibold">{t.tyreUid} — {t.make} {t.model}</div>
            <div>Vehicle: {t.vehicleId}</div>
            <div>Installed: {new Date(t.installDate).toLocaleDateString()}</div>
            <div>Active: {t.isActive ? 'Yes' : 'No'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}