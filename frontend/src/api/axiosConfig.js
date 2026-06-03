import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Uses deployed URL if available, else localhost
  withCredentials: true, // Crucial for sending/receiving cookies (JWT)
});

export default api;
