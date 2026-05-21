import { Readable } from 'node:stream';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ErrorCode } from '@supfile/shared';
import type { User as UserShared } from '@supfile/shared';
import { OAuth2Client } from 'google-auth-library';

import { EnvConfig } from '../../config/env.config';
import { PrismaService } from '../../prisma/prisma.service';
import { STORAGE_SERVICE, StorageService } from '../../storage/storage.interface';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import type { GoogleProfileLite } from '../strategies/google.strategy';

import { HashService } from './hash.service';
import { TokenService } from './token.service';

export interface AuthResult {
  user: UserShared;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hash: HashService,
    private readonly tokens: TokenService,
    private readonly env: EnvConfig,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_ALREADY_USED,
        message: 'Cet email est déjà utilisé',
      });
    }

    const passwordHash = await this.hash.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      },
    });

    const tokens = await this.tokens.issuePair(user.id, user.email);
    return { user: this.toShared(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Identifiants invalides',
      });
    }

    const ok = await this.hash.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Identifiants invalides',
      });
    }

    const tokens = await this.tokens.issuePair(user.id, user.email);
    return { user: this.toShared(user), ...tokens };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload;
    try {
      payload = await this.tokens.verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Refresh token invalide ou expiré',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Utilisateur introuvable',
      });
    }

    const tokens = await this.tokens.issuePair(user.id, user.email);
    return { user: this.toShared(user), ...tokens };
  }

  async loginOrCreateOAuth(provider: string, profile: GoogleProfileLite): Promise<AuthResult> {
    const oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: { provider, providerId: profile.providerId },
      },
      include: { user: true },
    });

    let user = oauthAccount?.user;

    if (!user) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingByEmail) {
        await this.prisma.oAuthAccount.create({
          data: {
            provider,
            providerId: profile.providerId,
            userId: existingByEmail.id,
          },
        });
        user = existingByEmail;
      } else {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            oauthAccounts: {
              create: { provider, providerId: profile.providerId },
            },
          },
        });
      }
    }

    const tokens = await this.tokens.issuePair(user.id, user.email);
    return { user: this.toShared(user), ...tokens };
  }

  async loginWithGoogleIdToken(idToken: string): Promise<AuthResult> {
    const client = new OAuth2Client();
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: this.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Token Google invalide',
      });
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Token Google sans identifiant',
      });
    }

    return this.loginOrCreateOAuth('google', {
      providerId: payload.sub,
      email: payload.email,
      displayName: payload.name ?? payload.email.split('@')[0],
      avatarUrl: payload.picture ?? null,
    });
  }

  async getCurrentUser(userId: string): Promise<UserShared> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toShared(user);
  }

  async updateProfile(
    userId: string,
    input: { email?: string; displayName?: string; avatarUrl?: string | null },
  ): Promise<UserShared> {
    const data: { email?: string; displayName?: string; avatarUrl?: string | null } = {};

    if (input.email !== undefined) {
      const normalized = input.email.toLowerCase().trim();
      const taken = await this.prisma.user.findFirst({
        where: { email: normalized, NOT: { id: userId } },
        select: { id: true },
      });
      if (taken) {
        throw new ConflictException({
          code: ErrorCode.EMAIL_ALREADY_USED,
          message: 'Cet email est déjà utilisé',
        });
      }
      data.email = normalized;
    }

    if (input.displayName !== undefined) {
      const trimmed = input.displayName.trim();
      if (trimmed.length < 2) {
        throw new BadRequestException('Le nom doit faire au moins 2 caractères');
      }
      data.displayName = trimmed;
    }

    if (input.avatarUrl !== undefined) {
      data.avatarUrl = input.avatarUrl;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Rien à modifier');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.toShared(updated);
  }

  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string },
    publicBaseUrl: string,
  ): Promise<UserShared> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    // sauve via le storage service (sous-dossier <userId>/<uuid>)
    const stream = Readable.from(file.buffer);
    const { storagePath } = await this.storage.save(userId, stream);

    // supprime l'ancien avatar si stocké chez nous (URL relative qu'on a générée)
    if (user.avatarUrl && user.avatarUrl.includes('/auth/avatars/')) {
      const oldPath = user.avatarUrl.split('/auth/avatars/')[1];
      if (oldPath) {
        await this.storage.delete(decodeURIComponent(oldPath)).catch(() => undefined);
      }
    }

    // URL publique stockée dans avatarUrl, servie par GET /auth/avatars/:storagePath
    const avatarUrl = `${publicBaseUrl}/auth/avatars/${encodeURIComponent(storagePath)}`;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return this.toShared(updated);
  }

  async readAvatarStream(storagePath: string): Promise<{ stream: Readable; mimeType: string }> {
    // Sécurité : on ne sert que les fichiers explicitement enregistrés comme avatar dans la BDD
    const owner = await this.prisma.user.findFirst({
      where: { avatarUrl: { contains: `/auth/avatars/${encodeURIComponent(storagePath)}` } },
      select: { id: true },
    });
    if (!owner) {
      throw new UnauthorizedException();
    }
    // sniffer magic bytes pour deviner le mime de l'image
    const sniffStream = await this.storage.read(storagePath);
    const chunks: Buffer[] = [];
    let totalLen = 0;
    for await (const chunk of sniffStream) {
      chunks.push(chunk as Buffer);
      totalLen += (chunk as Buffer).length;
      if (totalLen >= 16) break;
    }
    sniffStream.destroy();
    const head = Buffer.concat(chunks).subarray(0, 16);
    const mimeType = detectImageMime(head);
    const stream = await this.storage.read(storagePath);
    return { stream, mimeType };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Ce compte a été créé via OAuth, il n a pas de mot de passe local',
      );
    }
    const ok = await this.hash.compare(oldPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Ancien mot de passe incorrect',
      });
    }
    if (newPassword.length < 8) {
      throw new BadRequestException('Le nouveau mot de passe doit faire au moins 8 caractères');
    }
    const newHash = await this.hash.hash(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  private toShared(user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserShared {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

function detectImageMime(head: Buffer): string {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    head.length >= 8 &&
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47
  ) {
    return 'image/png';
  }
  if (head.length >= 3 && head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) {
    return 'image/gif';
  }
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return 'image/webp';
  }
  return 'application/octet-stream';
}
