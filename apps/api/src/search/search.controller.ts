import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { JwtPayload } from '@supfile/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  do(@CurrentUser() user: JwtPayload, @Query() dto: SearchQueryDto) {
    return this.search.search(user.sub, dto);
  }
}
