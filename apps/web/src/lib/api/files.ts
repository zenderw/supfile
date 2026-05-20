import { api } from '@/lib/api';

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  shared?: boolean;
  sharedBy?: { id: string; displayName: string; email: string };
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

  async create(input: { name: string; parentId?: string | null }): Promise<FolderItem> {
    const { data } = await api.post<FolderItem>('/folders', input);
    return data;
  },

  async update(
    id: string,
    input: { name?: string; parentId?: string | null },
  ): Promise<FolderItem> {
    const { data } = await api.patch<FolderItem>(`/folders/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/folders/${id}`);
  },
};

export const filesApi = {
  async get(id: string): Promise<FileItem> {
    const { data } = await api.get<FileItem>(`/files/${id}`);
    return data;
  },

  async upload(
    file: File,
    folderId: string | null,
    onProgress?: (pct: number) => void,
  ): Promise<FileItem> {
    const form = new FormData();
    form.append('file', file);
    if (folderId) form.append('folderId', folderId);

    const { data } = await api.post<FileItem>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    });
    return data;
  },

  async update(id: string, input: { name?: string; folderId?: string | null }): Promise<FileItem> {
    const { data } = await api.patch<FileItem>(`/files/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  },

  async downloadFolderZip(folderId: string, folderName: string): Promise<void> {
    const { data } = await api.get<{ token: string }>(`/files/folders/${folderId}/download-token`);
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
    const url = `${base}/files/folders/${folderId}/download?token=${encodeURIComponent(data.token)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
