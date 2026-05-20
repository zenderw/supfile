import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@supfile/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ShareFolderDto } from './dto/share-folder.dto';
import { FolderShareService } from './folder-share.service';

@ApiTags('share')
@ApiBearerAuth()
@Controller('share/folders')
@UseGuards(JwtAuthGuard)
export class FolderShareController {
  constructor(private readonly service: FolderShareService) {}

  @Get('incoming')
  listIncoming(@CurrentUser() user: JwtPayload) {
    return this.service.listIncoming(user.sub);
  }

  @Get(':id/users')
  listForFolder(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) folderId: string,
  ) {
    return this.service.listForFolder(user.sub, folderId);
  }

  @Post(':id/users')
  share(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) folderId: string,
    @Body() dto: ShareFolderDto,
  ) {
    return this.service.shareWithUser(user.sub, folderId, dto.email);
  }

  @Delete(':id/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) folderId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) toUserId: string,
  ) {
    await this.service.revoke(user.sub, folderId, toUserId);
  }
}
