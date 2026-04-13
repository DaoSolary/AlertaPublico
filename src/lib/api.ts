import axios from 'axios';

// 🌐 Base URL (sem barra no final)
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://seguranca-escolar-backend.onrender.com/api';

if (import.meta.env.DEV) {
  console.log('🌐 API Base URL:', API_BASE_URL);
}

// 🔧 Instância do Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: false, // 🔥 IMPORTANTE para cookies
});

// 🔐 Interceptor de request (token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🚨 Interceptor de resposta (erros)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn('🔒 Sessão expirada');

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.location.href = '/login';
    }

    if (status === 500) {
      console.error('💥 Erro interno do servidor');
    }

    return Promise.reject(error);
  }
);

export default api;