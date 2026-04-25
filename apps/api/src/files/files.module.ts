import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ZipService } from './zip.service';

@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [FilesService, ZipService],
  exports: [FilesService],
})
export class FilesModule {}
