import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { SearchQueryDto } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, dto: SearchQueryDto) {
    const q = dto.q.trim();
    const limit = dto.limit ?? 50;
    const type = dto.type ?? 'all';

    const wantFolders = type === 'all' || type === 'folder';
    const wantFiles = type === 'all' || type === 'file';

    const [folders, files] = await Promise.all([
      wantFolders
        ? this.prisma.folder.findMany({
            where: {
              ownerId: userId,
              deletedAt: null,
              name: { contains: q, mode: 'insensitive' },
            },
            select: { id: true, name: true, parentId: true, updatedAt: true },
            take: limit,
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),
      wantFiles
        ? this.prisma.file.findMany({
            where: {
              ownerId: userId,
              deletedAt: null,
              name: { contains: q, mode: 'insensitive' },
            },
            select: {
              id: true,
              name: true,
              mimeType: true,
              size: true,
              folderId: true,
              updatedAt: true,
            },
            take: limit,
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    return { folders, files, query: q };
  }
}
