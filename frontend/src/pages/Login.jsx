import React, { useState } from 'react';
import api from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('admin@fleet.local');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data?.data?.token) {
        localStorage.setItem('fm_token', res.data.data.token);
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
      <form onSubmit={submit} className="space-y-4">
        <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
        {error && <div className="text-red-600">{error}</div>}
      </form>
      <div className="text-sm text-gray-500 mt-3">Use seeded admin: admin@fleet.local / password123</div>
    </div>
  );
}