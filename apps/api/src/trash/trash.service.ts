import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';

const NOT_FOUND = 'NOT_FOUND';

@Injectable()
export class TrashService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async list(userId: string) {
    const [folders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: { ownerId: userId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
        select: {
          id: true,
          name: true,
          parentId: true,
          deletedAt: true,
        },
      }),
      this.prisma.file.findMany({
        where: { ownerId: userId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
        select: {
          id: true,
          name: true,
          size: true,
          mimeType: true,
          folderId: true,
          deletedAt: true,
        },
      }),
    ]);

    return { folders, files };
  }

  async restoreFolder(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, ownerId: userId, deletedAt: { not: null } },
    });
    if (!folder) {
      throw new NotFoundException({ code: NOT_FOUND });
    }

    let parentId = folder.parentId;
    if (parentId) {
      const parent = await this.prisma.folder.findFirst({
        where: { id: parentId, ownerId: userId, deletedAt: null },
      });
      if (!parent) parentId = null;
    }

    return this.prisma.folder.update({
      where: { id: folderId },
      data: { deletedAt: null, parentId },
      select: { id: true, name: true, parentId: true },
    });
  }

  async restoreFile(userId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, ownerId: userId, deletedAt: { not: null } },
    });
    if (!file) {
      throw new NotFoundException({ code: NOT_FOUND });
    }

    let folderId = file.folderId;
    if (folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: folderId, ownerId: userId, deletedAt: null },
      });
      if (!folder) folderId = null;
    }

    return this.prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: null, folderId },
      select: {
        id: true,
        name: true,
        size: true,
        mimeType: true,
        folderId: true,
      },
    });
  }

  async purgeFile(userId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, ownerId: userId, deletedAt: { not: null } },
    });
    if (!file) {
      throw new NotFoundException({ code: NOT_FOUND });
    }

    await this.storage.delete(file.storagePath);

    await this.prisma.$transaction([
      this.prisma.file.delete({ where: { id: fileId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { usedSpace: { decrement: file.size } },
      }),
    ]);

    return { purgedFiles: 1, freedBytes: file.size.toString() };
  }

  async purgeFolder(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, ownerId: userId, deletedAt: { not: null } },
    });
    if (!folder) {
      throw new NotFoundException({ code: NOT_FOUND });
    }

    const allFiles = await this.collectDescendantFiles(folder.id);
    const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0n);

    await Promise.all(allFiles.map((f) => this.storage.delete(f.storagePath)));

    await this.prisma.$transaction(async (tx) => {
      if (allFiles.length > 0) {
        await tx.file.deleteMany({
          where: { id: { in: allFiles.map((f) => f.id) } },
        });
      }
      const subFolders = await tx.folder.findMany({
        where: { ownerId: userId },
        select: { id: true, parentId: true },
      });
      const toDelete = this.collectFolderTree(folderId, subFolders);
      for (const id of toDelete.reverse()) {
        await tx.folder.delete({ where: { id } });
      }

      if (totalSize > 0n) {
        await tx.user.update({
          where: { id: userId },
          data: { usedSpace: { decrement: totalSize } },
        });
      }
    });

    return { purgedFiles: allFiles.length, freedBytes: totalSize.toString() };
  }

  private async collectDescendantFiles(rootFolderId: string) {
    const result: { id: string; storagePath: string; size: bigint }[] = [];
    let currentLevel = [rootFolderId];

    while (currentLevel.length > 0) {
      const [subFolders, files] = await Promise.all([
        this.prisma.folder.findMany({
          where: { parentId: { in: currentLevel } },
          select: { id: true },
        }),
        this.prisma.file.findMany({
          where: { folderId: { in: currentLevel } },
          select: { id: true, storagePath: true, size: true },
        }),
      ]);

      result.push(...files);
      currentLevel = subFolders.map((f) => f.id);
    }

    return result;
  }

  private collectFolderTree(
    rootId: string,
    all: Array<{ id: string; parentId: string | null }>,
  ): string[] {
    const result: string[] = [rootId];
    const byParent = new Map<string, string[]>();
    for (const f of all) {
      if (f.parentId) {
        const arr = byParent.get(f.parentId) ?? [];
        arr.push(f.id);
        byParent.set(f.parentId, arr);
      }
    }

    const queue = [rootId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const children = byParent.get(id) ?? [];
      result.push(...children);
      queue.push(...children);
    }

    return result;
  }
}
