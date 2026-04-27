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
