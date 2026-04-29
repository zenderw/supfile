import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { EnvConfig } from '../config/env.config';

interface DownloadPayload {
  sub: string;
  fileId: string;
}

@Injectable()
export class DownloadTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly env: EnvConfig,
  ) {}

  sign(userId: string, fileId: string): string {
    const payload: DownloadPayload = { sub: userId, fileId };
    return this.jwt.sign(payload, {
      secret: this.env.JWT_SECRET,
      expiresIn: '60s',
    });
  }

  verify(token: string): DownloadPayload {
    return this.jwt.verify<DownloadPayload>(token, {
      secret: this.env.JWT_SECRET,
    });
  }
}
