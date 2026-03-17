import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { HashService } from './services/hash.service';
import { TokenService } from './services/token.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [HashService, TokenService, AuthService],
  exports: [HashService, TokenService],
})
export class AuthModule {}
