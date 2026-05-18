import { Plan } from '@prisma/client';

export interface PlanFeatures {
  name: string;
  priceMonthlyEur: number;
  quotaBytes: bigint;
  maxFileBytes: bigint;
  maxActiveShareLinks: number;
  passwordProtectedShares: boolean;
  customExpiry: boolean;
  prioritySupport: boolean;
}

const GB = BigInt(1024 * 1024 * 1024);
const MB = BigInt(1024 * 1024);

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  FREE: {
    name: 'Free',
    priceMonthlyEur: 0,
    quotaBytes: BigInt(5) * GB,
    maxFileBytes: BigInt(500) * MB,
    maxActiveShareLinks: 3,
    passwordProtectedShares: false,
    customExpiry: false,
    prioritySupport: false,
  },
  PRO: {
    name: 'Pro',
    priceMonthlyEur: 4.99,
    quotaBytes: BigInt(100) * GB,
    maxFileBytes: BigInt(5) * GB,
    maxActiveShareLinks: 100,
    passwordProtectedShares: true,
    customExpiry: true,
    prioritySupport: false,
  },
  BUSINESS: {
    name: 'Business',
    priceMonthlyEur: 14.99,
    quotaBytes: BigInt(1024) * GB,
    maxFileBytes: BigInt(20) * GB,
    maxActiveShareLinks: 1000,
    passwordProtectedShares: true,
    customExpiry: true,
    prioritySupport: true,
  },
};

export function featuresFor(plan: Plan): PlanFeatures {
  return PLAN_FEATURES[plan];
}
