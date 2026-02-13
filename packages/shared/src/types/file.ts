export interface FileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  folderId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
