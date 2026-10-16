import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Adjunta el token guardado a cada petición (si existe)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lotificadora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expiró o es inválido, manda de vuelta al login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lotificadora_token');
      localStorage.removeItem('lotificadora_usuario');
      if (!window.location.pathname.startsWith('/portal')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
