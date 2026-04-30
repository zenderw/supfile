import { Readable } from 'node:stream';

export interface SaveResult {
  storagePath: string;
  size: bigint;
}

export interface StorageService {
  save(userId: string, stream: Readable): Promise<SaveResult>;
  read(storagePath: string): Promise<Readable>;
  readRange(storagePath: string, start: number, end: number): Promise<Readable>;
  delete(storagePath: string): Promise<void>;
  exists(storagePath: string): Promise<boolean>;
  size(storagePath: string): Promise<number>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
