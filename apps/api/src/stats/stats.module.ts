import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PlansModule } from '../plans/plans.module';

import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [AuthModule, PlansModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
