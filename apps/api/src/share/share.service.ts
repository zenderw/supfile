import { randomBytes } from 'node:crypto';

import {
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PlansService } from '../plans/plans.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateShareDto } from './dto/create-share.dto';

function generateToken() {
  return randomBytes(24).toString('base64url');
}

@Injectable()
export class ShareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlansService,
  ) {}

  async create(userId: string, fileId: string, dto: CreateShareDto) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, ownerId: userId, deletedAt: null },
    });
    if (!file) throw new NotFoundException('Fichier introuvable');

    await this.plans.assertActiveLinksUnderLimit(userId);
    if (dto.password) {
      await this.plans.assertCanCreatePasswordShare(userId);
    }
    if (dto.expiresInHours) {
      await this.plans.assertCanCreateCustomExpiry(userId);
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;
    const expiresAt = dto.expiresInHours
      ? new Date(Date.now() + dto.expiresInHours * 3600_000)
      : null;

    const link = await this.prisma.shareLink.create({
      data: {
        token: generateToken(),
        fileId,
        ownerId: userId,
        passwordHash,
        expiresAt,
      },
    });

    return this.toDto(link, file);
  }

  async listMine(userId: string) {
    const links = await this.prisma.shareLink.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { file: { select: { id: true, name: true, mimeType: true, size: true } } },
    });
    return links.map((l) => ({
      id: l.id,
      token: l.token,
      fileId: l.fileId,
      file: l.file,
      hasPassword: !!l.passwordHash,
      expiresAt: l.expiresAt,
      revokedAt: l.revokedAt,
      downloads: l.downloads,
      createdAt: l.createdAt,
    }));
  }

  async revoke(userId: string, linkId: string) {
    const link = await this.prisma.shareLink.findFirst({
      where: { id: linkId, ownerId: userId },
    });
    if (!link) throw new NotFoundException('Lien introuvable');
    if (link.revokedAt) return;
    await this.prisma.shareLink.update({
      where: { id: linkId },
      data: { revokedAt: new Date() },
    });
  }

  async getPublic(token: string) {
    const link = await this.findActive(token);
    const file = await this.prisma.file.findUnique({
      where: { id: link.fileId },
      select: { id: true, name: true, mimeType: true, size: true, deletedAt: true },
    });
    if (!file || file.deletedAt) {
      throw new NotFoundException('Fichier introuvable');
    }
    return {
      name: file.name,
      mimeType: file.mimeType,
      size: file.size.toString(),
      requiresPassword: !!link.passwordHash,
      expiresAt: link.expiresAt,
    };
  }

  async verifyPassword(token: string, password?: string) {
    const link = await this.findActive(token);
    if (link.passwordHash) {
      if (!password) throw new UnauthorizedException('Mot de passe requis');
      const ok = await bcrypt.compare(password, link.passwordHash);
      if (!ok) throw new UnauthorizedException('Mot de passe invalide');
    }
    return { ok: true };
  }

  async resolveForDownload(token: string, password?: string) {
    const link = await this.findActive(token);
    if (link.passwordHash) {
      if (!password) throw new UnauthorizedException('Mot de passe requis');
      const ok = await bcrypt.compare(password, link.passwordHash);
      if (!ok) throw new UnauthorizedException('Mot de passe invalide');
    }
    const file = await this.prisma.file.findUnique({ where: { id: link.fileId } });
    if (!file || file.deletedAt) {
      throw new NotFoundException('Fichier introuvable');
    }

    this.prisma.shareLink
      .update({ where: { id: link.id }, data: { downloads: { increment: 1 } } })
      .catch(() => {
      });

    return file;
  }

  private async findActive(token: string) {
    const link = await this.prisma.shareLink.findUnique({ where: { token } });
    if (!link) throw new NotFoundException('Lien introuvable');
    if (link.revokedAt) throw new ForbiddenException('Lien révoqué');
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new GoneException('Lien expiré');
    }
    return link;
  }

  private toDto(
    link: { id: string; token: string; expiresAt: Date | null; passwordHash: string | null },
    file: { id: string; name: string },
  ) {
    return {
      id: link.id,
      token: link.token,
      fileId: file.id,
      fileName: file.name,
      hasPassword: !!link.passwordHash,
      expiresAt: link.expiresAt,
    };
  }
}
