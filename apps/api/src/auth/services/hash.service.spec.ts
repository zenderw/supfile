import { Test } from '@nestjs/testing';

import { HashService } from './hash.service';

describe('HashService', () => {
  let service: HashService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [HashService],
    }).compile();
    service = module.get(HashService);
  });

  it('hashe un mot de passe et le résultat ne contient pas le clair', async () => {
    const hash = await service.hash('password123');
    expect(hash).not.toContain('password123');
    expect(hash.length).toBeGreaterThan(50);
  });

  it('vérifie correctement un mot de passe valide', async () => {
    const hash = await service.hash('password123');
    expect(await service.compare('password123', hash)).toBe(true);
  });

  it('rejette un mot de passe invalide', async () => {
    const hash = await service.hash('password123');
    expect(await service.compare('mauvais', hash)).toBe(false);
  });

  it('produit des hashes différents pour le même mot de passe (sel)', async () => {
    const a = await service.hash('password123');
    const b = await service.hash('password123');
    expect(a).not.toBe(b);
  });
});
