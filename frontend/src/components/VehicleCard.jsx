import React from 'react';

const statusColor = (status) => {
  switch (status) {
    case 'MOVING': return 'bg-green-200 text-green-800';
    case 'IDLING_ENGINE_ON': return 'bg-yellow-200 text-yellow-800';
    case 'STOPPED_ENGINE_OFF': return 'bg-gray-200 text-gray-800';
    case 'OFFLINE': return 'bg-red-200 text-red-800';
    default: return 'bg-blue-100 text-blue-800';
  }
};

export default function VehicleCard({ vehicle }) {
  return (
    <div className="p-4 bg-white rounded shadow flex items-center justify-between">
      <div>
        <div className="text-lg font-semibold">{vehicle.name} ({vehicle.registrationNumber})</div>
        <div className="text-sm text-gray-500">{vehicle.currentLatitude?.toFixed(4) || '-'}, {vehicle.currentLongitude?.toFixed(4) || '-'}</div>
        <div className="text-sm text-gray-500">Speed: {vehicle.currentSpeed || 0} km/h • Ignition: {vehicle.ignitionOn ? 'On' : 'Off'}</div>
      </div>
      <div className={`px-3 py-1 rounded ${statusColor(vehicle.status)}`}>{vehicle.status}</div>
    </div>
  );
}