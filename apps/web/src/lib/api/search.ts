import { api } from '@/lib/api';

export type SearchCategory = 'all' | 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'other';

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

export interface SearchOptions {
  type?: 'all' | 'folder' | 'file';
  category?: SearchCategory;
  from?: string;
  to?: string;
}

export const searchApi = {
  async run(q: string, options: SearchOptions = {}): Promise<SearchResult> {
    const params: Record<string, string> = { q };
    if (options.type && options.type !== 'all') params.type = options.type;
    if (options.category && options.category !== 'all') params.category = options.category;
    if (options.from) params.from = options.from;
    if (options.to) params.to = options.to;
    const { data } = await api.get<SearchResult>('/search', { params });
    return data;
  },
};
