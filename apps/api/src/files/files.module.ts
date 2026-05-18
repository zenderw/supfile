import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from '../auth/auth.module';
import { EnvConfig } from '../config/env.config';
import { PlansModule } from '../plans/plans.module';

import { DownloadTokenService } from './download-token.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ZipService } from './zip.service';

@Module({
  imports: [AuthModule, JwtModule.register({}), PlansModule],
  controllers: [FilesController],
  providers: [FilesService, ZipService, DownloadTokenService, EnvConfig],
  exports: [FilesService],
})
export class FilesModule {}
