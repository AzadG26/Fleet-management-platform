import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000/api' });

export function setAuthToken(token){ api.defaults.headers.common['Authorization'] = `Bearer ${token}`; }
export default api;
