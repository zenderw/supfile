import type { User } from '@supfile/shared';

import { api } from '@/lib/api';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  async register(input: { email: string; password: string; displayName: string }) {
    const { data } = await api.post<AuthResponse>('/auth/register', input);
    return data;
  },
  async login(input: { email: string; password: string }) {
    const { data } = await api.post<AuthResponse>('/auth/login', input);
    return data;
  },
  async refresh(refreshToken: string) {
    const { data } = await api.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },
  async me() {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
  async loginWithGoogleIdToken(idToken: string) {
    const { data } = await api.post<AuthResponse>('/auth/google/mobile', {
      idToken,
    });
    return data;
  },
};
