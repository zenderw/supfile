import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { PublicShareController, ShareController } from './share.controller';
import { ShareService } from './share.service';

@Module({
  imports: [AuthModule],
  controllers: [ShareController, PublicShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
