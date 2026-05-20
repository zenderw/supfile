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
    const [user, totalFolders, totalFiles, recent, aggregates, quota] = await Promise.all([
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
        take: 5,
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
      byCategory: aggregates.counts,
      sizeByCategory: aggregates.sizes,
    };
  }

  private async aggregateByCategory(userId: string) {
    const all = await this.prisma.file.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: { mimeType: true, size: true },
    });
    const counts = { image: 0, video: 0, audio: 0, pdf: 0, document: 0, other: 0 };
    const sizes = {
      image: BigInt(0),
      video: BigInt(0),
      audio: BigInt(0),
      pdf: BigInt(0),
      document: BigInt(0),
      other: BigInt(0),
    };

    for (const f of all) {
      let key: keyof typeof counts;
      const m = f.mimeType;
      if (m.startsWith('image/')) key = 'image';
      else if (m.startsWith('video/')) key = 'video';
      else if (m.startsWith('audio/')) key = 'audio';
      else if (m === 'application/pdf') key = 'pdf';
      else if (
        m.startsWith('text/') ||
        m.includes('word') ||
        m.includes('excel') ||
        m.includes('spreadsheet') ||
        m.includes('document') ||
        m.includes('presentation')
      ) {
        key = 'document';
      } else {
        key = 'other';
      }
      counts[key]++;
      sizes[key] += f.size;
    }

    return {
      counts,
      sizes: {
        image: sizes.image.toString(),
        video: sizes.video.toString(),
        audio: sizes.audio.toString(),
        pdf: sizes.pdf.toString(),
        document: sizes.document.toString(),
        other: sizes.other.toString(),
      },
    };
  }
}
