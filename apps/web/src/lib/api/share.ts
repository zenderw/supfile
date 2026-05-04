import { api } from '@/lib/api';

export interface ShareLink {
  id: string;
  token: string;
  fileId: string;
  fileName?: string;
  file?: { id: string; name: string; mimeType: string; size: string };
  hasPassword: boolean;
  expiresAt: string | null;
  revokedAt?: string | null;
  downloads?: number;
  createdAt?: string;
}

export interface CreateShareInput {
  password?: string;
  expiresInHours?: number;
}

export interface PublicShareMeta {
  name: string;
  mimeType: string;
  size: string;
  requiresPassword: boolean;
  expiresAt: string | null;
}

export const shareApi = {
  async create(fileId: string, input: CreateShareInput): Promise<ShareLink> {
    const { data } = await api.post<ShareLink>(`/share/files/${fileId}`, input);
    return data;
  },

  async listMine(): Promise<ShareLink[]> {
    const { data } = await api.get<ShareLink[]>('/share/mine');
    return data;
  },

  async revoke(id: string): Promise<void> {
    await api.delete(`/share/${id}`);
  },

  buildShareUrl(token: string): string {
    return `${window.location.origin}/s/${token}`;
  },

  async getPublicMeta(token: string): Promise<PublicShareMeta> {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
    const r = await fetch(`${base}/s/${encodeURIComponent(token)}`);
    if (!r.ok) {
      const body = (await r.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message ?? `HTTP ${r.status}`);
    }
    return r.json();
  },

  async verifyPassword(token: string, password?: string): Promise<void> {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
    const r = await fetch(`${base}/s/${encodeURIComponent(token)}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!r.ok) {
      const body = (await r.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message ?? `HTTP ${r.status}`);
    }
  },

  buildDownloadUrl(token: string, password?: string): string {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
    const url = new URL(`${base}/s/${encodeURIComponent(token)}/download`);
    if (password) url.searchParams.set('password', password);
    return url.toString();
  },
};
