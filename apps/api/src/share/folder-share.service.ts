import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FolderShareService {
  constructor(private readonly prisma: PrismaService) {}

  async shareWithUser(fromUserId: string, folderId: string, targetEmail: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, ownerId: fromUserId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!folder) throw new NotFoundException('Dossier introuvable');

    const target = await this.prisma.user.findUnique({
      where: { email: targetEmail.toLowerCase().trim() },
      select: { id: true, email: true, displayName: true },
    });
    if (!target) throw new NotFoundException('Aucun utilisateur avec cet email');
    if (target.id === fromUserId) {
      throw new BadRequestException('Vous ne pouvez pas vous partager un dossier');
    }

    const existing = await this.prisma.folderShare.findUnique({
      where: { folderId_toUserId: { folderId, toUserId: target.id } },
    });
    if (existing) {
      throw new ConflictException('Ce dossier est déjà partagé avec cet utilisateur');
    }

    const share = await this.prisma.folderShare.create({
      data: { folderId, fromUserId, toUserId: target.id },
      select: {
        id: true,
        createdAt: true,
        toUser: { select: { id: true, email: true, displayName: true } },
      },
    });

    return {
      id: share.id,
      createdAt: share.createdAt,
      folder: { id: folder.id, name: folder.name },
      toUser: share.toUser,
    };
  }

  async listForFolder(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, ownerId: userId, deletedAt: null },
      select: { id: true },
    });
    if (!folder) throw new NotFoundException('Dossier introuvable');

    const shares = await this.prisma.folderShare.findMany({
      where: { folderId },
      select: {
        id: true,
        createdAt: true,
        toUser: { select: { id: true, email: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares;
  }

  async listIncoming(userId: string) {
    const shares = await this.prisma.folderShare.findMany({
      where: { toUserId: userId, folder: { deletedAt: null } },
      select: {
        id: true,
        createdAt: true,
        folder: {
          select: {
            id: true,
            name: true,
            updatedAt: true,
          },
        },
        fromUser: { select: { id: true, email: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares;
  }

  async revoke(fromUserId: string, folderId: string, toUserId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, ownerId: fromUserId },
      select: { id: true },
    });
    if (!folder) throw new NotFoundException('Dossier introuvable');

    const share = await this.prisma.folderShare.findUnique({
      where: { folderId_toUserId: { folderId, toUserId } },
    });
    if (!share) throw new NotFoundException('Partage introuvable');

    await this.prisma.folderShare.delete({ where: { id: share.id } });
  }

  async canReadFolder(userId: string, folderId: string): Promise<boolean> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { ownerId: true, deletedAt: true },
    });
    if (!folder || folder.deletedAt) return false;
    if (folder.ownerId === userId) return true;

    const share = await this.prisma.folderShare.findUnique({
      where: { folderId_toUserId: { folderId, toUserId: userId } },
    });
    return !!share;
  }
}
