import { api } from '@/lib/api';

export type PlanId = 'FREE' | 'PRO' | 'BUSINESS';

export interface PlanFeatures {
  id: PlanId;
  name: string;
  priceMonthlyEur: number;
  quotaBytes: string;
  maxFileBytes: string;
  maxActiveShareLinks: number;
  passwordProtectedShares: boolean;
  customExpiry: boolean;
  prioritySupport: boolean;
}

export interface MyPlan {
  plan: PlanId;
  planUpdatedAt: string;
  usedSpace: string;
  features: PlanFeatures;
}

export const plansApi = {
  async list(): Promise<PlanFeatures[]> {
    const { data } = await api.get<PlanFeatures[]>('/plans');
    return data;
  },
  async me(): Promise<MyPlan> {
    const { data } = await api.get<MyPlan>('/plans/me');
    return data;
  },
  async upgrade(target: PlanId): Promise<{ plan: PlanId; planUpdatedAt: string }> {
    const { data } = await api.post('/plans/me/upgrade', { target });
    return data;
  },
};
