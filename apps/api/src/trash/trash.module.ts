import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { TrashController } from './trash.controller';
import { TrashService } from './trash.service';

@Module({
  imports: [AuthModule],
  controllers: [TrashController],
  providers: [TrashService],
})
export class TrashModule {}
