import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import VehicleCard from '../components/VehicleCard.jsx';

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);

  const load = async () => {
    try {
      const res = await api.get('/api/vehicles');
      setVehicles(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4">
        {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
      </div>
    </div>
  );
}