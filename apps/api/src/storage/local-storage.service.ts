import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable, pipeline } from 'node:stream';
import { promisify } from 'node:util';

import { Injectable, Logger } from '@nestjs/common';

import { EnvConfig } from '../config/env.config';

import { SaveResult, StorageService } from './storage.interface';

const pipelineAsync = promisify(pipeline);

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);

  constructor(private readonly env: EnvConfig) {}

  async save(userId: string, stream: Readable): Promise<SaveResult> {
    const fileId = randomUUID();
    const userDir = path.join(this.env.STORAGE_PATH, userId);
    await mkdir(userDir, { recursive: true });

    const fullPath = path.join(userDir, fileId);
    const writeStream = createWriteStream(fullPath);

    let bytesWritten = 0n;
    stream.on('data', (chunk: Buffer) => {
      bytesWritten += BigInt(chunk.length);
    });

    try {
      await pipelineAsync(stream, writeStream);
    } catch (err) {
      await unlink(fullPath).catch(() => undefined);
      throw err;
    }

    const storagePath = `${userId}/${fileId}`;
    this.logger.log(`Saved ${storagePath} (${bytesWritten} bytes)`);
    return { storagePath, size: bytesWritten };
  }

  async read(storagePath: string): Promise<Readable> {
    return createReadStream(this.resolve(storagePath));
  }

  async readRange(storagePath: string, start: number, end: number): Promise<Readable> {
    return createReadStream(this.resolve(storagePath), { start, end });
  }

  async delete(storagePath: string): Promise<void> {
    try {
      await unlink(this.resolve(storagePath));
      this.logger.log(`Deleted ${storagePath}`);
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      if (error.code !== 'ENOENT') throw err;
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    try {
      await stat(this.resolve(storagePath));
      return true;
    } catch {
      return false;
    }
  }

  async size(storagePath: string): Promise<number> {
    const s = await stat(this.resolve(storagePath));
    return s.size;
  }

  private resolve(storagePath: string): string {
    if (storagePath.includes('..') || path.isAbsolute(storagePath)) {
      throw new Error(`storagePath invalide : ${storagePath}`);
    }
    return path.join(this.env.STORAGE_PATH, storagePath);
  }
}
