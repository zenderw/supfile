import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { EnvConfig } from '../../config/env.config';

export interface GoogleProfileLite {
  providerId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(env: EnvConfig) {
    super({
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Profil Google sans email'), undefined);
      return;
    }

    const lite: GoogleProfileLite = {
      providerId: profile.id,
      email,
      displayName: profile.displayName ?? email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };

    done(null, lite);
  }
}
