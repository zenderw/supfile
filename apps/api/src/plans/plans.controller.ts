import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';
import type { JwtPayload } from '@supfile/shared';
import { Plan } from '@prisma/client';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PlansService } from './plans.service';

class UpgradeDto {
  @IsIn(['FREE', 'PRO', 'BUSINESS'])
  target!: Plan;
}

@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  list() {
    return this.plans.listPlans();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.plans.getMyPlan(user.sub);
  }

  @Post('me/upgrade')
  @UseGuards(JwtAuthGuard)
  upgrade(@CurrentUser() user: JwtPayload, @Body() dto: UpgradeDto) {
    return this.plans.upgradeTo(user.sub, dto.target);
  }
}
