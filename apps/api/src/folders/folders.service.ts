import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

const NOT_FOUND = 'NOT_FOUND';
const MAX_FOLDER_DEPTH = 20;

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, parentId: string | null) {
    if (parentId) {
      await this.assertOwnership(userId, parentId);
    }

    const [folders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: { ownerId: userId, parentId, deletedAt: null },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.file.findMany({
        where: { ownerId: userId, folderId: parentId, deletedAt: null },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          size: true,
          mimeType: true,
          folderId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return { folders, files };
  }

  async breadcrumb(userId: string, folderId: string): Promise<BreadcrumbItem[]> {
    const items: BreadcrumbItem[] = [];
    let currentId: string | null = folderId;
    let depth = 0;

    while (currentId && depth < MAX_FOLDER_DEPTH) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: currentId },
        select: {
          id: true,
          name: true,
          parentId: true,
          ownerId: true,
          deletedAt: true,
        },
      });

      if (!folder || folder.ownerId !== userId || folder.deletedAt) {
        throw new NotFoundException({ code: NOT_FOUND });
      }

      items.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
      depth++;
    }

    items.unshift({ id: null, name: 'Mes fichiers' });
    return items;
  }

  async create(userId: string, dto: CreateFolderDto) {
    if (dto.parentId) {
      await this.assertOwnership(userId, dto.parentId);
      await this.assertDepthLimit(dto.parentId);
    }

    return this.prisma.folder.create({
      data: {
        name: dto.name.trim(),
        parentId: dto.parentId ?? null,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(userId: string, folderId: string, dto: UpdateFolderDto) {
    await this.assertOwnership(userId, folderId);

    const data: { name?: string; parentId?: string | null } = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId !== null) {
        if (dto.parentId === folderId) {
          throw new BadRequestException({
            code: 'INVALID_MOVE',
            message: 'Un dossier ne peut pas être son propre parent',
          });
        }
        await this.assertOwnership(userId, dto.parentId);
        await this.assertNotDescendant(folderId, dto.parentId);
        await this.assertDepthLimit(dto.parentId);
      }
      data.parentId = dto.parentId;
    }

    return this.prisma.folder.update({
      where: { id: folderId },
      data,
      select: {
        id: true,
        name: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async assertOwnership(userId: string, folderId: string): Promise<void> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { ownerId: true, deletedAt: true },
    });

    if (!folder || folder.ownerId !== userId || folder.deletedAt) {
      throw new NotFoundException({ code: NOT_FOUND });
    }
  }

  private async assertDepthLimit(parentId: string): Promise<void> {
    let currentId: string | null = parentId;
    let depth = 1;

    while (currentId && depth <= MAX_FOLDER_DEPTH) {
      const parent = await this.prisma.folder.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      if (!parent) break;
      currentId = parent.parentId;
      depth++;
    }

    if (depth > MAX_FOLDER_DEPTH) {
      throw new ForbiddenException({
        code: 'MAX_DEPTH_EXCEEDED',
        message: `Profondeur max de ${MAX_FOLDER_DEPTH} dossiers atteinte`,
      });
    }
  }

  private async assertNotDescendant(folderId: string, targetParentId: string): Promise<void> {
    let currentId: string | null = targetParentId;
    let depth = 0;

    while (currentId && depth < MAX_FOLDER_DEPTH) {
      if (currentId === folderId) {
        throw new BadRequestException({
          code: 'INVALID_MOVE',
          message: 'Impossible de déplacer un dossier dans son propre descendant',
        });
      }
      const parent = await this.prisma.folder.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      currentId = parent?.parentId ?? null;
      depth++;
    }
  }
}
