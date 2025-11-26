import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FuelReports from './pages/FuelReports.jsx';
import Geofencing from './pages/Geofencing.jsx';
import Tyres from './pages/Tyres.jsx';
import Documents from './pages/Documents.jsx';
import Sidebar from './components/Sidebar.jsx';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('fm_token');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/fuel" element={<PrivateRoute><FuelReports /></PrivateRoute>} />
          <Route path="/geofence" element={<PrivateRoute><Geofencing /></PrivateRoute>} />
          <Route path="/tyres" element={<PrivateRoute><Tyres /></PrivateRoute>} />
          <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
        </Routes>
      </div>
    </div>
  );
}