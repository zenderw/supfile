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

  get JWT_ACCESS_TTL(): number {
    return Number(this.config.getOrThrow<string>('JWT_ACCESS_TTL'));
  }

  get JWT_REFRESH_TTL(): number {
    return Number(this.config.getOrThrow<string>('JWT_REFRESH_TTL'));
  }

  get STORAGE_PATH(): string {
    return this.config.getOrThrow<string>('STORAGE_PATH');
  }

  get GOOGLE_CLIENT_ID(): string {
    return this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
  }

  get GOOGLE_CLIENT_SECRET(): string {
    return this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
  }

  get GOOGLE_CALLBACK_URL(): string {
    return this.config.getOrThrow<string>('GOOGLE_CALLBACK_URL');
  }

  get WEB_OAUTH_REDIRECT_URL(): string {
    return this.config.getOrThrow<string>('WEB_OAUTH_REDIRECT_URL');
  }

  get isGoogleOAuthEnabled(): boolean {
    return Boolean(this.config.get('GOOGLE_CLIENT_ID') && this.config.get('GOOGLE_CLIENT_SECRET'));
  }
}
