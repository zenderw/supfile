import axios, { AxiosInstance } from 'axios';

import { useAuthStore } from '@/stores/auth.store';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
