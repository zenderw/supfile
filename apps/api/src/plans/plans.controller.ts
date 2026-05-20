import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Plan } from '@prisma/client';
import type { JwtPayload } from '@supfile/shared';
import { IsIn } from 'class-validator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PlansService } from './plans.service';

class UpgradeDto {
  @IsIn(['FREE', 'PRO', 'BUSINESS'])
  target!: Plan;
}

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  list() {
    return this.plans.listPlans();
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.plans.getMyPlan(user.sub);
  }

  @Post('me/upgrade')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  upgrade(@CurrentUser() user: JwtPayload, @Body() dto: UpgradeDto) {
    return this.plans.upgradeTo(user.sub, dto.target);
  }
}
