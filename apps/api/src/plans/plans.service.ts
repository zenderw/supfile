import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Plan } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { PLAN_FEATURES, featuresFor } from './plan-features';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  listPlans() {
    return (Object.keys(PLAN_FEATURES) as Plan[]).map((p) => ({
      id: p,
      ...PLAN_FEATURES[p],
      quotaBytes: PLAN_FEATURES[p].quotaBytes.toString(),
      maxFileBytes: PLAN_FEATURES[p].maxFileBytes.toString(),
    }));
  }

  async getMyPlan(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planUpdatedAt: true, usedSpace: true },
    });
    if (!user) throw new NotFoundException('User introuvable');
    const features = featuresFor(user.plan);
    return {
      plan: user.plan,
      planUpdatedAt: user.planUpdatedAt,
      usedSpace: user.usedSpace.toString(),
      features: {
        ...features,
        quotaBytes: features.quotaBytes.toString(),
        maxFileBytes: features.maxFileBytes.toString(),
      },
    };
  }

  async upgradeTo(userId: string, target: Plan) {
    if (!Object.keys(PLAN_FEATURES).includes(target)) {
      throw new BadRequestException('Plan invalide');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, usedSpace: true },
    });
    if (!user) throw new NotFoundException('User introuvable');
    if (user.plan === target) {
      throw new BadRequestException('Deja sur ce plan');
    }
    const targetFeatures = featuresFor(target);
    if (user.usedSpace > targetFeatures.quotaBytes) {
      throw new ForbiddenException(
        'Vous depassez le quota du plan cible. Liberez de l espace avant de downgrade.',
      );
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { plan: target, planUpdatedAt: new Date() },
      select: { plan: true, planUpdatedAt: true },
    });
  }

  async assertCanCreatePasswordShare(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { plan: true },
    });
    const features = featuresFor(user.plan);
    if (!features.passwordProtectedShares) {
      throw new ForbiddenException(
        'Le partage avec mot de passe est reserve aux plans payants. Passez au plan Pro.',
      );
    }
  }

  async assertCanCreateCustomExpiry(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { plan: true },
    });
    const features = featuresFor(user.plan);
    if (!features.customExpiry) {
      throw new ForbiddenException(
        'L expiration personnalisee est reservee aux plans payants. Passez au plan Pro.',
      );
    }
  }

  async assertActiveLinksUnderLimit(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { plan: true },
    });
    const features = featuresFor(user.plan);
    const activeCount = await this.prisma.shareLink.count({
      where: { ownerId: userId, revokedAt: null },
    });
    if (activeCount >= features.maxActiveShareLinks) {
      throw new ForbiddenException(
        `Vous avez atteint la limite de ${features.maxActiveShareLinks} liens actifs pour votre plan ${user.plan}. Revoquez d anciens liens ou passez a un plan superieur.`,
      );
    }
  }

  async getQuotaFor(userId: string): Promise<bigint> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { plan: true },
    });
    return featuresFor(user.plan).quotaBytes;
  }

  async getMaxFileSizeFor(userId: string): Promise<bigint> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { plan: true },
    });
    return featuresFor(user.plan).maxFileBytes;
  }
}
