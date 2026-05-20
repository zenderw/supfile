import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PlansModule } from '../plans/plans.module';

import { FolderShareController } from './folder-share.controller';
import { FolderShareService } from './folder-share.service';
import { PublicShareController, ShareController } from './share.controller';
import { ShareService } from './share.service';

@Module({
  imports: [AuthModule, PlansModule],
  controllers: [ShareController, PublicShareController, FolderShareController],
  providers: [ShareService, FolderShareService],
  exports: [ShareService, FolderShareService],
})
export class ShareModule {}
