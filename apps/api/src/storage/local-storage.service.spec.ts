import { rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import { Test } from '@nestjs/testing';

import { EnvConfig } from '../config/env.config';

import { LocalStorageService } from './local-storage.service';

const TEST_STORAGE = path.join(__dirname, '../../.test-storage');

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LocalStorageService,
        {
          provide: EnvConfig,
          useValue: { STORAGE_PATH: TEST_STORAGE },
        },
      ],
    }).compile();

    service = module.get(LocalStorageService);
  });

  afterEach(async () => {
    await rm(TEST_STORAGE, { recursive: true, force: true });
  });

  it('sauvegarde un stream et retourne un storagePath', async () => {
    const data = Buffer.from('contenu test');
    const stream = Readable.from(data);

    const result = await service.save('user-1', stream);

    expect(result.storagePath).toMatch(/^user-1\/[\w-]+$/);
    expect(result.size).toBe(BigInt(data.length));
    expect(await service.exists(result.storagePath)).toBe(true);
  });

  it('lit un fichier sauvegardé', async () => {
    const data = Buffer.from('hello world');
    const { storagePath } = await service.save('user-1', Readable.from(data));

    const readStream = await service.read(storagePath);
    const chunks: Buffer[] = [];
    for await (const chunk of readStream) chunks.push(chunk as Buffer);
    const result = Buffer.concat(chunks);

    expect(result.toString()).toBe('hello world');
  });

  it("lit une plage d'octets via readRange", async () => {
    const data = Buffer.from('0123456789');
    const { storagePath } = await service.save('user-1', Readable.from(data));

    const stream = await service.readRange(storagePath, 2, 5);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);

    expect(Buffer.concat(chunks).toString()).toBe('2345');
  });

  it('supprime un fichier', async () => {
    const { storagePath } = await service.save('user-1', Readable.from('x'));
    await service.delete(storagePath);
    expect(await service.exists(storagePath)).toBe(false);
  });

  it("delete est idempotent (pas d'erreur si fichier absent)", async () => {
    await expect(service.delete('user-1/inexistant')).resolves.toBeUndefined();
  });

  it('rejette les storagePaths suspects', async () => {
    await expect(service.read('../etc/passwd')).rejects.toThrow();
    await expect(service.read('/etc/passwd')).rejects.toThrow();
  });
});
