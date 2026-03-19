import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ErrorCode } from '@supfile/shared';
import type { User as UserShared } from '@supfile/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

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
