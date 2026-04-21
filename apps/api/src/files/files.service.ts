import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';

import { UpdateFileDto } from './dto/update-file.dto';

const NOT_FOUND = 'NOT_FOUND';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async getMetadata(userId: string, fileId: string) {
    const file = await this.findOwned(userId, fileId);
    return {
      id: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      folderId: file.folderId,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  async update(userId: string, fileId: string, dto: UpdateFileDto) {
    await this.findOwned(userId, fileId);

    const data: { name?: string; folderId?: string | null } = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.folderId !== undefined) {
      if (dto.folderId !== null) {
        await this.assertFolderOwnership(userId, dto.folderId);
      }
      data.folderId = dto.folderId;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException({ message: 'Rien à modifier' });
    }

    return this.prisma.file.update({
      where: { id: fileId },
      data,
      select: {
        id: true,
        name: true,
        size: true,
        mimeType: true,
        folderId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async softDelete(userId: string, fileId: string): Promise<void> {
    await this.findOwned(userId, fileId);
    await this.prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });
  }

  private async findOwned(userId: string, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.ownerId !== userId || file.deletedAt) {
      throw new NotFoundException({ code: NOT_FOUND });
    }

    return file;
  }

  private async assertFolderOwnership(userId: string, folderId: string): Promise<void> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { ownerId: true, deletedAt: true },
    });

    if (!folder || folder.ownerId !== userId || folder.deletedAt) {
      throw new NotFoundException({ code: NOT_FOUND });
    }
  }
}
