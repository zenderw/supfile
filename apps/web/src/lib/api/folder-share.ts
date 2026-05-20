import { api } from '@/lib/api';

export interface InternalShareUser {
  id: string;
  email: string;
  displayName: string;
}

export interface FolderShareForOwner {
  id: string;
  createdAt: string;
  toUser: InternalShareUser;
}

export interface IncomingFolderShare {
  id: string;
  createdAt: string;
  folder: { id: string; name: string; updatedAt: string };
  fromUser: InternalShareUser;
}

export const folderShareApi = {
  async listForFolder(folderId: string): Promise<FolderShareForOwner[]> {
    const { data } = await api.get<FolderShareForOwner[]>(`/share/folders/${folderId}/users`);
    return data;
  },

  async share(folderId: string, email: string): Promise<FolderShareForOwner> {
    const { data } = await api.post<FolderShareForOwner>(`/share/folders/${folderId}/users`, {
      email,
    });
    return data;
  },

  async revoke(folderId: string, userId: string): Promise<void> {
    await api.delete(`/share/folders/${folderId}/users/${userId}`);
  },

  async listIncoming(): Promise<IncomingFolderShare[]> {
    const { data } = await api.get<IncomingFolderShare[]>('/share/folders/incoming');
    return data;
  },
};
