import { api } from '@/lib/api';

export interface CategoryCounts {
  image: number;
  video: number;
  audio: number;
  pdf: number;
  document: number;
  other: number;
}

export interface DashboardStats {
  usedSpace: string;
  quota: string;
  totalFolders: number;
  totalFiles: number;
  recentFiles: Array<{
    id: string;
    name: string;
    size: string;
    mimeType: string;
    folderId: string | null;
    updatedAt: string;
  }>;
  byCategory: CategoryCounts;
}

export const statsApi = {
  async me(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/stats');
    return data;
  },
};
