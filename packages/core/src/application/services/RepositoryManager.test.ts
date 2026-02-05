import { describe, it, expect, beforeEach } from 'vitest';
import { RepositoryManager } from '@application';
import { InMemoryMessageStructureRepository } from '@infrastructure/repositories';
import { Standard } from '@domain/value-objects/Standard';
import { Version } from '@domain/value-objects/Version';
import type { MessageStructureDTO } from '@infrastructure/repositories/dtos';

describe('RepositoryManager', () => {
  let manager: RepositoryManager;
  let edifactRepository: InMemoryMessageStructureRepository;
  let x12Repository: InMemoryMessageStructureRepository;

  let ordersStructure: MessageStructureDTO;
  let invoicStructure: MessageStructureDTO;
  let desadvStructure: MessageStructureDTO;

  beforeEach(() => {
    manager = new RepositoryManager();
    edifactRepository = new InMemoryMessageStructureRepository();
    x12Repository = new InMemoryMessageStructureRepository();

    // Create sample EDIFACT structures
    ordersStructure = {
      messageType: 'ORDERS',
      version: 'D.96A',
      standard: 'EDIFACT',
      name: 'Purchase Order',
      structure: [],
    };

    invoicStructure = {
      messageType: 'INVOIC',
      version: 'D.96A',
      standard: 'EDIFACT',
      name: 'Invoice',
      structure: [],
    };

    desadvStructure = {
      messageType: 'DESADV',
      version: 'D.01B',
      standard: 'EDIFACT',
      name: 'Despatch Advice',
      structure: [],
    };
  });

  describe('addRepository', () => {
    it('should add a repository to the manager', async () => {
      edifactRepository.register(ordersStructure);
      manager.addRepository(edifactRepository);

      const repository = await manager.findRepository(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'));
      expect(repository).toBe(edifactRepository);
    });

    it('should allow adding multiple repositories', async () => {
      edifactRepository.register(ordersStructure);
      x12Repository.register({
        messageType: '850',
        version: '005010',
        standard: 'X12',
        name: 'Purchase Order',
        structure: [],
      });

      manager.addRepository(edifactRepository);
      manager.addRepository(x12Repository);

      expect(await manager.findRepository(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'))).toBe(edifactRepository);
      expect(await manager.findRepository(Standard.X12, new Version(Standard.X12, '005010'))).toBe(x12Repository);
    });
  });

  describe('findRepository', () => {
    it('should return null when no repositories are registered', async () => {
      const result = await manager.findRepository(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'));
      expect(result).toBeNull();
    });

    it('should return null when repository for standard/version is not found', async () => {
      edifactRepository.register(ordersStructure);
      manager.addRepository(edifactRepository);

      const result = await manager.findRepository(Standard.X12, new Version(Standard.X12, '005010'));
      expect(result).toBeNull();
    });

    it('should find repository by standard and version', async () => {
      edifactRepository.register(ordersStructure);
      manager.addRepository(edifactRepository);

      const result = await manager.findRepository(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'));
      expect(result).toBe(edifactRepository);
    });

    it('should search repositories in order and return first match', async () => {
      const edifactRepo1 = new InMemoryMessageStructureRepository();
      const edifactRepo2 = new InMemoryMessageStructureRepository();

      edifactRepo1.register(ordersStructure);
      edifactRepo2.register(invoicStructure);

      manager.addRepository(edifactRepo1);
      manager.addRepository(edifactRepo2);

      const result = await manager.findRepository(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'));
      // Should return the first one added
      expect(result).toBe(edifactRepo1);
    });

    it('should handle multiple versions in same repository', async () => {
      edifactRepository.register(ordersStructure); // D.96A
      edifactRepository.register(desadvStructure); // D.01B

      manager.addRepository(edifactRepository);

      const result96A = await manager.findRepository(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'));
      const result01B = await manager.findRepository(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.01B'));

      expect(result96A).toBe(edifactRepository);
      expect(result01B).toBe(edifactRepository);
    });
  });

  describe('findDefinition', () => {
    it('should return null when no repositories are registered', async () => {
      const result = await manager.findDefinition(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'), 'ORDERS');
      expect(result).toBeNull();
    });

    it('should return null when definition is not found in any repository', async () => {
      edifactRepository.register(ordersStructure);
      manager.addRepository(edifactRepository);

      const result = await manager.findDefinition(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'), 'PRICAT');
      expect(result).toBeNull();
    });

    it('should find definition from repository', async () => {
      edifactRepository.register(ordersStructure);
      manager.addRepository(edifactRepository);

      const result = await manager.findDefinition(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'), 'ORDERS');
      expect(result).toEqual(ordersStructure);
    });

    it('should find definition from correct repository', async () => {
      edifactRepository.register(ordersStructure);
      edifactRepository.register(invoicStructure);

      manager.addRepository(edifactRepository);

      const result = await manager.findDefinition(Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'), 'INVOIC');
      expect(result).toEqual(invoicStructure);
    });
  });
});


