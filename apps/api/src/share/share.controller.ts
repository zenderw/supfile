import { Readable } from 'node:stream';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '@supfile/shared';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';

import { CreateShareDto } from './dto/create-share.dto';
import { VerifyShareDto } from './dto/verify-share.dto';
import { ShareService } from './share.service';

@Controller('share')
export class ShareController {
  constructor(
    private readonly share: ShareService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  @Post('files/:fileId')
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: JwtPayload,
    @Param('fileId', new ParseUUIDPipe({ version: '4' })) fileId: string,
    @Body() dto: CreateShareDto,
  ) {
    return this.share.create(user.sub, fileId, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: JwtPayload) {
    return this.share.listMine(user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    await this.share.revoke(user.sub, id);
  }
}

@Controller('s')
export class PublicShareController {
  constructor(
    private readonly share: ShareService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  @Get(':token')
  getMeta(@Param('token') token: string) {
    if (!token || token.length > 128) {
      throw new BadRequestException('Token invalide');
    }
    return this.share.getPublic(token);
  }

  @Post(':token/verify')
  @HttpCode(HttpStatus.OK)
  verify(@Param('token') token: string, @Body() dto: VerifyShareDto) {
    return this.share.verifyPassword(token, dto.password);
  }

  @Get(':token/download')
  async download(
    @Param('token') token: string,
    @Query('password') password: string | undefined,
    @Res() res: Response,
  ) {
    const file = await this.share.resolveForDownload(token, password);
    const total = await this.storage.size(file.storagePath);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(total));
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);

    const stream: Readable = await this.storage.read(file.storagePath);
    stream.pipe(res);
  }
}
