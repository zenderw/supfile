import { Injectable } from '@nestjs/common';

import { PlansService } from '../plans/plans.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlansService,
  ) {}

  async forUser(userId: string) {
    const [user, totalFolders, totalFiles, recent, byMime, quota] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { usedSpace: true, plan: true },
      }),
      this.prisma.folder.count({ where: { ownerId: userId, deletedAt: null } }),
      this.prisma.file.count({ where: { ownerId: userId, deletedAt: null } }),
      this.prisma.file.findMany({
        where: { ownerId: userId, deletedAt: null },
        select: {
          id: true,
          name: true,
          size: true,
          mimeType: true,
          folderId: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.aggregateByCategory(userId),
      this.plans.getQuotaFor(userId),
    ]);

    return {
      usedSpace: (user?.usedSpace ?? BigInt(0)).toString(),
      quota: quota.toString(),
      plan: user?.plan ?? 'FREE',
      totalFolders,
      totalFiles,
      recentFiles: recent,
      byCategory: byMime,
    };
  }

  private async aggregateByCategory(userId: string) {
    const all = await this.prisma.file.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: { mimeType: true },
    });
    const buckets = { image: 0, video: 0, audio: 0, pdf: 0, document: 0, other: 0 };
    for (const f of all) {
      const m = f.mimeType;
      if (m.startsWith('image/')) buckets.image++;
      else if (m.startsWith('video/')) buckets.video++;
      else if (m.startsWith('audio/')) buckets.audio++;
      else if (m === 'application/pdf') buckets.pdf++;
      else if (
        m.startsWith('text/') ||
        m.includes('word') ||
        m.includes('excel') ||
        m.includes('spreadsheet') ||
        m.includes('document') ||
        m.includes('presentation')
      ) {
        buckets.document++;
      } else buckets.other++;
    }
    return buckets;
  }
}
