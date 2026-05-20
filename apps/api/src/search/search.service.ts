import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { SearchCategory, SearchQueryDto } from './dto/search-query.dto';

function mimeFilterForCategory(category: SearchCategory): Prisma.StringFilter | undefined {
  switch (category) {
    case 'image':
      return { startsWith: 'image/' };
    case 'video':
      return { startsWith: 'video/' };
    case 'audio':
      return { startsWith: 'audio/' };
    case 'pdf':
      return { equals: 'application/pdf' };
    default:
      return undefined;
  }
}

const DOCUMENT_MIME_PATTERNS = [
  'text/',
  'word',
  'excel',
  'spreadsheet',
  'document',
  'presentation',
];

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, dto: SearchQueryDto) {
    const q = dto.q.trim();
    const limit = dto.limit ?? 50;
    const type = dto.type ?? 'all';
    const category = dto.category ?? 'all';

    const wantFolders = (type === 'all' || type === 'folder') && category === 'all';
    const wantFiles = type === 'all' || type === 'file';

    const dateFilter: Prisma.DateTimeFilter | undefined =
      dto.from || dto.to
        ? {
            ...(dto.from ? { gte: new Date(dto.from) } : {}),
            ...(dto.to ? { lte: new Date(dto.to) } : {}),
          }
        : undefined;

    const fileWhere: Prisma.FileWhereInput = {
      ownerId: userId,
      deletedAt: null,
      name: { contains: q, mode: 'insensitive' },
      ...(dateFilter ? { updatedAt: dateFilter } : {}),
    };

    const mimeFilter = mimeFilterForCategory(category);
    if (mimeFilter) {
      fileWhere.mimeType = mimeFilter;
    } else if (category === 'document') {
      fileWhere.OR = DOCUMENT_MIME_PATTERNS.map((p) =>
        p.endsWith('/') ? { mimeType: { startsWith: p } } : { mimeType: { contains: p } },
      );
    } else if (category === 'other') {
      fileWhere.AND = [
        { mimeType: { not: { startsWith: 'image/' } } },
        { mimeType: { not: { startsWith: 'video/' } } },
        { mimeType: { not: { startsWith: 'audio/' } } },
        { mimeType: { not: { equals: 'application/pdf' } } },
        ...DOCUMENT_MIME_PATTERNS.map(
          (p): Prisma.FileWhereInput =>
            p.endsWith('/')
              ? { mimeType: { not: { startsWith: p } } }
              : { mimeType: { not: { contains: p } } },
        ),
      ];
    }

    const [folders, files] = await Promise.all([
      wantFolders
        ? this.prisma.folder.findMany({
            where: {
              ownerId: userId,
              deletedAt: null,
              name: { contains: q, mode: 'insensitive' },
              ...(dateFilter ? { updatedAt: dateFilter } : {}),
            },
            select: { id: true, name: true, parentId: true, updatedAt: true },
            take: limit,
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),
      wantFiles
        ? this.prisma.file.findMany({
            where: fileWhere,
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
