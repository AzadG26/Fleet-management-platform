import React, { useState } from 'react';
import api, { setAuthToken } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [email,setEmail]=useState('admin@fleet.test');
  const [password,setPassword]=useState('password');
  const nav = useNavigate();
  async function submit(e){
    e.preventDefault();
    const res = await api.post('/auth/login', { email, password });
    setAuthToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    nav('/dashboard');
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="p-6 bg-white rounded shadow" onSubmit={submit}>
        <h2 className="text-xl mb-4">Login</h2>
        <input value={email} onChange={e=>setEmail(e.target.value)} className="block mb-2 p-2 border" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="block mb-4 p-2 border"/>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Login</button>
      </form>
    </div>
  );
}
