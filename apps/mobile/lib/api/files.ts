import { api } from '@/lib/api';

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderListing {
  folders: FolderItem[];
  files: FileItem[];
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export interface TrashListing {
  folders: Array<FolderItem & { deletedAt: string }>;
  files: Array<FileItem & { deletedAt: string }>;
}

export const foldersApi = {
  async list(parentId: string | null): Promise<FolderListing> {
    const { data } = await api.get<FolderListing>('/folders', {
      params: parentId ? { parentId } : {},
    });
    return data;
  },
  async breadcrumb(folderId: string): Promise<BreadcrumbItem[]> {
    const { data } = await api.get<BreadcrumbItem[]>(`/folders/${folderId}/breadcrumb`);
    return data;
  },
  async create(name: string, parentId: string | null): Promise<FolderItem> {
    const { data } = await api.post<FolderItem>('/folders', { name, parentId });
    return data;
  },
  async rename(id: string, name: string): Promise<FolderItem> {
    const { data } = await api.patch<FolderItem>(`/folders/${id}`, { name });
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/folders/${id}`);
  },
};

export const filesApi = {
  async upload(
    uri: string,
    name: string,
    mimeType: string,
    folderId: string | null,
  ): Promise<FileItem> {
    const form = new FormData();
    form.append('file', {
      uri,
      name,
      type: mimeType,
    } as unknown as Blob);
    if (folderId) form.append('folderId', folderId);

    const { data } = await api.post<FileItem>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  async rename(id: string, name: string): Promise<FileItem> {
    const { data } = await api.patch<FileItem>(`/files/${id}`, { name });
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  },
};

export interface ShareLinkDto {
  id: string;
  token: string;
  fileId: string;
  fileName?: string;
  hasPassword: boolean;
  expiresAt: string | null;
}

export const shareApi = {
  async create(
    fileId: string,
    input: { password?: string; expiresInHours?: number },
  ): Promise<ShareLinkDto> {
    const { data } = await api.post<ShareLinkDto>(`/share/files/${fileId}`, input);
    return data;
  },
  buildShareUrl(token: string): string {
    const webBase = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:5173';
    return `${webBase}/s/${token}`;
  },
};

export const previewApi = {
  async getMetadata(fileId: string): Promise<FileItem> {
    const { data } = await api.get<FileItem>(`/files/${fileId}`);
    return data;
  },
  async getDownloadToken(fileId: string): Promise<string> {
    const { data } = await api.get<{ token: string }>(`/files/${fileId}/download-token`);
    return data.token;
  },
  buildDownloadUrl(fileId: string, token: string): string {
    const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
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

export interface SearchResultDto {
  folders: Array<{ id: string; name: string; parentId: string | null; updatedAt: string }>;
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: string;
    folderId: string | null;
    updatedAt: string;
  }>;
  query: string;
}

export const searchApi = {
  async run(q: string, type: 'all' | 'folder' | 'file' = 'all'): Promise<SearchResultDto> {
    const { data } = await api.get<SearchResultDto>('/search', {
      params: { q, type },
    });
    return data;
  },
};

export const trashApi = {
  async list(): Promise<TrashListing> {
    const { data } = await api.get<TrashListing>('/trash');
    return data;
  },
  async restoreFolder(id: string): Promise<void> {
    await api.post(`/trash/folders/${id}/restore`);
  },
  async restoreFile(id: string): Promise<void> {
    await api.post(`/trash/files/${id}/restore`);
  },
  async purgeFolder(id: string): Promise<void> {
    await api.delete(`/trash/folders/${id}`);
  },
  async purgeFile(id: string): Promise<void> {
    await api.delete(`/trash/files/${id}`);
  },
};

export function formatBytes(bytesStr: string): string {
  const bytes = Number(bytesStr);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
