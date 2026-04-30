import { api } from '@/lib/api';

export interface FileMetadata {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  folderId: string | null;
}

export const previewApi = {
  async getMetadata(fileId: string): Promise<FileMetadata> {
    const { data } = await api.get<FileMetadata>(`/files/${fileId}`);
    return data;
  },

  async getDownloadToken(fileId: string): Promise<string> {
    const { data } = await api.get<{ token: string }>(`/files/${fileId}/download-token`);
    return data.token;
  },

  buildDownloadUrl(fileId: string, token: string): string {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
    return `${base}/files/${fileId}/download?token=${token}`;
  },
};

export type PreviewKind = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'unsupported';

export function kindOf(mime: string): PreviewKind {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml') {
    return 'text';
  }
  return 'unsupported';
}
