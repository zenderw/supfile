import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PlansModule } from '../plans/plans.module';

import { PublicShareController, ShareController } from './share.controller';
import { ShareService } from './share.service';

@Module({
  imports: [AuthModule, PlansModule],
  controllers: [ShareController, PublicShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
