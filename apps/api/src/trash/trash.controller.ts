import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@supfile/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { TrashService } from './trash.service';

@ApiTags('trash')
@ApiBearerAuth()
@Controller('trash')
@UseGuards(JwtAuthGuard)
export class TrashController {
  constructor(private readonly trash: TrashService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.trash.list(user.sub);
  }

  @Post('folders/:id/restore')
  restoreFolder(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.trash.restoreFolder(user.sub, id);
  }

  @Post('files/:id/restore')
  restoreFile(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.trash.restoreFile(user.sub, id);
  }

  @Delete('folders/:id')
  purgeFolder(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.trash.purgeFolder(user.sub, id);
  }

  @Delete('files/:id')
  purgeFile(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.trash.purgeFile(user.sub, id);
  }
}
