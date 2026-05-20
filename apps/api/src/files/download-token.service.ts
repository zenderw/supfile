import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { EnvConfig } from '../config/env.config';

interface FileDownloadPayload {
  sub: string;
  fileId: string;
}

interface FolderDownloadPayload {
  sub: string;
  folderId: string;
}

@Injectable()
export class DownloadTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly env: EnvConfig,
  ) {}

  sign(userId: string, fileId: string): string {
    const payload: FileDownloadPayload = { sub: userId, fileId };
    return this.jwt.sign(payload, {
      secret: this.env.JWT_SECRET,
      expiresIn: '60s',
    });
  }

  verify(token: string): FileDownloadPayload {
    return this.jwt.verify<FileDownloadPayload>(token, {
      secret: this.env.JWT_SECRET,
    });
  }

  signFolder(userId: string, folderId: string): string {
    const payload: FolderDownloadPayload = { sub: userId, folderId };
    return this.jwt.sign(payload, {
      secret: this.env.JWT_SECRET,
      expiresIn: '60s',
    });
  }

  verifyFolder(token: string): FolderDownloadPayload {
    return this.jwt.verify<FolderDownloadPayload>(token, {
      secret: this.env.JWT_SECRET,
    });
  }
}
