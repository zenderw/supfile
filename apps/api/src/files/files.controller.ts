import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { JwtPayload } from '@supfile/shared';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';

import { DownloadTokenService } from './download-token.service';
import { UpdateFileDto } from './dto/update-file.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { FilesService } from './files.service';
import { multerConfig } from './multer.config';
import { ZipService } from './zip.service';

@Controller('files')
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly zip: ZipService,
    private readonly downloadTokens: DownloadTokenService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException({
        message: 'Aucun fichier dans le payload',
      });
    }
    return this.files.uploadFile(user.sub, file, dto.folderId ?? null);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getMetadata(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.files.getMetadata(user.sub, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateFileDto,
  ) {
    return this.files.update(user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    await this.files.softDelete(user.sub, id);
  }

  @Get('folders/:id/download-token')
  @UseGuards(JwtAuthGuard)
  getFolderDownloadToken(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return { token: this.downloadTokens.signFolder(user.sub, id) };
  }

  @Get('folders/:id/download')
  async downloadFolder(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }

    let payload;
    try {
      payload = this.downloadTokens.verifyFolder(token);
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    if (payload.folderId !== id) {
      throw new UnauthorizedException('Token ne correspond pas au dossier');
    }

    const safeName = `archive-${id.slice(0, 8)}`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.zip"`);
    res.setHeader('Cache-Control', 'no-store');

    await this.zip.streamFolder(payload.sub, id, res);
  }

  @Get(':id/download-token')
  @UseGuards(JwtAuthGuard)
  async getDownloadToken(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    await this.files.getMetadata(user.sub, id);
    return { token: this.downloadTokens.sign(user.sub, id) };
  }

  @Get(':id/download')
  async download(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('token') token: string,
    @Headers('range') range: string | undefined,
    @Res() res: Response,
  ) {
    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }

    let payload;
    try {
      payload = this.downloadTokens.verify(token);
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    if (payload.fileId !== id) {
      throw new UnauthorizedException('Token ne correspond pas au fichier');
    }

    const file = await this.files.findByIdInternal(payload.sub, id);
    const total = await this.storage.size(file.storagePath);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);

    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match) {
        throw new BadRequestException('Range invalide');
      }
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : total - 1;

      if (start >= total || end >= total) {
        res.status(416).setHeader('Content-Range', `bytes */${total}`);
        return res.end();
      }

      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', String(chunkSize));

      const stream = await this.storage.readRange(file.storagePath, start, end);
      stream.pipe(res);
    } else {
      res.setHeader('Content-Length', String(total));
      const stream = await this.storage.read(file.storagePath);
      stream.pipe(res);
    }
  }
}
