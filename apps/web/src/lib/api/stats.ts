import { api } from '@/lib/api';

export interface CategoryCounts {
  image: number;
  video: number;
  audio: number;
  pdf: number;
  document: number;
  other: number;
}

export interface CategorySizes {
  image: string;
  video: string;
  audio: string;
  pdf: string;
  document: string;
  other: string;
}

export interface DashboardStats {
  usedSpace: string;
  quota: string;
  plan?: 'FREE' | 'PRO' | 'BUSINESS';
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
  sizeByCategory: CategorySizes;
}

export const statsApi = {
  async me(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/stats');
    return data;
  },
};
