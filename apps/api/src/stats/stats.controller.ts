import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@supfile/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  me(@CurrentUser() user: JwtPayload) {
    return this.stats.forUser(user.sub);
  }
}
