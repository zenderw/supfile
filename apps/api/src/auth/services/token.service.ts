import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '@supfile/shared';

import { EnvConfig } from '../../config/env.config';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly env: EnvConfig,
  ) {}

  async issuePair(userId: string, email: string): Promise<TokenPair> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.env.JWT_SECRET,
        expiresIn: this.env.JWT_ACCESS_TTL,
      }),
      this.jwt.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.env.JWT_SECRET,
          expiresIn: this.env.JWT_REFRESH_TTL,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyAccess(token: string): Promise<JwtPayload> {
    return this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.env.JWT_SECRET,
    });
  }

  async verifyRefresh(token: string): Promise<JwtPayload & { type: string }> {
    const payload = await this.jwt.verifyAsync<JwtPayload & { type: string }>(token, {
      secret: this.env.JWT_SECRET,
    });
    if (payload.type !== 'refresh') {
      throw new Error("Token n'est pas un refresh token");
    }
    return payload;
  }
}
