import { Readable } from 'node:stream';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';

import { UpdateFileDto } from './dto/update-file.dto';

const NOT_FOUND = 'NOT_FOUND';
const QUOTA_EXCEEDED = 'QUOTA_EXCEEDED';
const DEFAULT_USER_QUOTA = BigInt(30) * BigInt(1024 * 1024 * 1024);

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

  async findByIdInternal(userId: string, fileId: string) {
    return this.findOwned(userId, fileId);
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

  async uploadFile(
    userId: string,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    folderId: string | null,
  ) {
    if (folderId) {
      await this.assertFolderOwnership(userId, folderId);
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { usedSpace: true },
    });

    const incomingSize = BigInt(file.size);
    if (user.usedSpace + incomingSize > DEFAULT_USER_QUOTA) {
      throw new ConflictException({
        code: QUOTA_EXCEEDED,
        message: 'Quota dépassé',
      });
    }

    const stream = Readable.from(file.buffer);
    const { storagePath, size } = await this.storage.save(userId, stream);

    if (size !== incomingSize) {
      await this.storage.delete(storagePath);
      throw new ConflictException({
        code: 'SIZE_MISMATCH',
        message: 'Taille reçue incohérente',
      });
    }

    const cleanName = sanitizeFileName(file.originalname);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.file.create({
          data: {
            name: cleanName,
            size,
            mimeType: file.mimetype,
            storagePath,
            folderId,
            ownerId: userId,
          },
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

        await tx.user.update({
          where: { id: userId },
          data: { usedSpace: { increment: size } },
        });

        return created;
      });
    } catch (err) {
      await this.storage.delete(storagePath);
      throw err;
    }
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

function sanitizeFileName(raw: string): string {
  const cleaned = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f/\\]/g, '_')
    .trim()
    .slice(0, 255);
  return cleaned || 'fichier';
}
