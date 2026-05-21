import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EnvConfig } from '../config/env.config';
import { StorageModule } from '../storage/storage.module';

import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { HashService } from './services/hash.service';
import { TokenService } from './services/token.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    StorageModule,
  ],
  controllers: [AuthController],
  providers: [
    EnvConfig,
    HashService,
    TokenService,
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
  ],
  exports: [HashService, TokenService, JwtAuthGuard],
})
export class AuthModule {}
