import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import archiver from 'archiver';
import type { Response } from 'express';

import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';

@Injectable()
export class ZipService {
  private readonly logger = new Logger(ZipService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async streamFolder(userId: string, folderId: string, res: Response): Promise<void> {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, ownerId: userId, deletedAt: null },
    });
    if (!folder) {
      throw new NotFoundException({ code: 'NOT_FOUND' });
    }

    const archive = archiver('zip', { store: true });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        this.logger.warn(`ZIP warning: fichier manquant ${err.message}`);
      } else {
        throw err;
      }
    });

    archive.on('error', (err) => {
      this.logger.error('ZIP error', err);
      res.destroy(err);
    });

    archive.pipe(res);

    await this.addFolderToArchive(archive, folder.id, '');

    await archive.finalize();
  }

  private async addFolderToArchive(
    archive: archiver.Archiver,
    folderId: string,
    pathPrefix: string,
  ): Promise<void> {
    const [subFolders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: { parentId: folderId, deletedAt: null },
        select: { id: true, name: true },
      }),
      this.prisma.file.findMany({
        where: { folderId, deletedAt: null },
        select: { id: true, name: true, storagePath: true },
      }),
    ]);

    for (const file of files) {
      const stream = await this.storage.read(file.storagePath);
      archive.append(stream, { name: `${pathPrefix}${file.name}` });
    }

    for (const sub of subFolders) {
      await this.addFolderToArchive(archive, sub.id, `${pathPrefix}${sub.name}/`);
    }
  }
}
