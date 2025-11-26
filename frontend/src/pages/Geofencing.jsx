import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Geofencing() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', radius: 500 });

  const load = async () => {
    const res = await api.get('/api/geofence');
    setList(res.data.data || []);
  };

  const create = async () => {
    await api.post('/api/geofence', { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), radius: Number(form.radius) });
    setForm({ name: '', latitude: '', longitude: '', radius: 500 });
    await load();
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Geofencing</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Create Geofence</h3>
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full mb-2 p-2 border" />
            <input placeholder="Latitude" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} className="w-full mb-2 p-2 border" />
            <input placeholder="Longitude" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} className="w-full mb-2 p-2 border" />
            <input placeholder="Radius (m)" value={form.radius} onChange={e => setForm({ ...form, radius: e.target.value })} className="w-full mb-2 p-2 border" />
            <button onClick={create} className="bg-blue-600 text-white p-2 rounded">Create</button>
          </div>
        </div>
        <div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Existing Geofences</h3>
            <ul>
              {list.map(g => <li key={g.id} className="p-2 border-b">{g.name} — {g.latitude}, {g.longitude} ({g.radius}m)</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}