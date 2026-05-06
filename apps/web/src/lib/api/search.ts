import { api } from '@/lib/api';

export interface SearchFolder {
  id: string;
  name: string;
  parentId: string | null;
  updatedAt: string;
}

export interface SearchFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  folderId: string | null;
  updatedAt: string;
}

export interface SearchResult {
  folders: SearchFolder[];
  files: SearchFile[];
  query: string;
}

export const searchApi = {
  async run(q: string, type: 'all' | 'folder' | 'file' = 'all'): Promise<SearchResult> {
    const { data } = await api.get<SearchResult>('/search', {
      params: { q, type },
    });
    return data;
  },
};
