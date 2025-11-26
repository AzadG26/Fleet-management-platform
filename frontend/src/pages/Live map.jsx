import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../services/api';

export default function LiveMap(){
  const [vehicles, setVehicles] = useState([]);
  useEffect(() => {
    async function load() {
      const res = await api.get('/vehicles'); // create a simple endpoint later to return latest telemetry per vehicle
      setVehicles(res.data);
    }
    load();
    const iid = setInterval(load, 5000);
    return () => clearInterval(iid);
  }, []);
  return (
    <div className="h-[80vh]">
      <MapContainer center={[20.5937,78.9629]} zoom={6} style={{height:'100%'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        {vehicles.map(v=>(
          <Marker key={v.imei} position={[v.lat, v.lon]}>
            <Popup>
              <div><strong>{v.name}</strong><br/>Speed: {v.speed} km/h</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
