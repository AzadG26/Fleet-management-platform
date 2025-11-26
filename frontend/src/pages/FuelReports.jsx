import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function FuelReports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        // For demo: take first vehicle
        const vres = await api.get('/api/vehicles');
        const vehicle = vres.data.data?.[0];
        if (!vehicle) return;
        const r = await api.get(`/api/fuel/reports/${vehicle.id}`);
        setData(r.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, []);

  if (!data) return <div>Loading fuel report...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Fuel Reports</h1>
      <div className="bg-white p-4 rounded shadow">
        <div>Total Fuel Added: {data.totalFuelAdded}</div>
        <div>Average KMPL: {data.averageKmpl}</div>
        <div>Fuel Logs: {data.fuelLogCount}</div>
      </div>
    </div>
  );
}