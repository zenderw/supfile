import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfig {
  constructor(private readonly config: ConfigService) {}

  get PORT(): number {
    return Number(this.config.get<string>('PORT'));
  }

  get DATABASE_URL(): string {
    return this.config.getOrThrow<string>('DATABASE_URL');
  }

  get JWT_SECRET(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }
}
