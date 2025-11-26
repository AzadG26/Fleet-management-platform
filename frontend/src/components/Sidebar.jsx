import React from 'react';
import { NavLink } from 'react-router-dom';

const Link = ({ to, children }) => (
  <NavLink to={to} className={({ isActive }) => `block px-4 py-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
    {children}
  </NavLink>
);

export default function Sidebar() {
  const logout = () => {
    localStorage.removeItem('fm_token');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-white border-r h-screen p-4">
      <h3 className="text-xl font-bold mb-4">Fleet Management</h3>
      <Link to="/">Dashboard</Link>
      <Link to="/geofence">Geofencing</Link>
      <Link to="/fuel">Fuel Reports</Link>
      <Link to="/tyres">Tyres</Link>
      <Link to="/documents">Documents</Link>
      <button onClick={logout} className="mt-6 w-full bg-red-500 text-white p-2 rounded">Logout</button>
    </aside>
  );
}