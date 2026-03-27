import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

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

interface RetriedConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriedConfig | undefined;

    const isAuthEndpoint = original?.url?.includes('/auth/');

    if (error.response?.status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const { refreshToken, setSession, clear } = useAuthStore.getState();
    if (!refreshToken) {
      clear();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          original.headers.Authorization = `Bearer ${token}`;
          original._retry = true;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post<{
        user: import('@supfile/shared').User;
        accessToken: string;
        refreshToken: string;
      }>(`${baseURL}/auth/refresh`, { refreshToken });

      setSession(data.user, data.accessToken, data.refreshToken);
      flushQueue(data.accessToken);

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      original._retry = true;
      return api(original);
    } catch (refreshErr) {
      flushQueue(null);
      clear();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
