import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {BuildCommand} from "../../../src/presentation/cli/commands";
import {DIContainer} from "../../../src/infrastructure/container";


describe('BuildCommand - Integration Tests (US-5.3)', () => {
  const testDir = join(tmpdir(), 'ediflow-test-build-', Date.now().toString());
  const testFile = join(testDir, 'test.json');
  const outputFile = join(testDir, 'output.edi');

  let container: DIContainer;
  let buildCommand: BuildCommand;

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    container = DIContainer.getInstance();
    buildCommand = new BuildCommand(container.getUseCaseFactory());
  });

  afterEach(() => {
    try {
      if (existsSync(testFile)) unlinkSync(testFile);
      if (existsSync(outputFile)) unlinkSync(outputFile);
      if (existsSync(testDir)) rmdirSync(testDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Happy Path - Valid JSON Input', () => {
    it('should build EDI message from valid JSON', async () => {
      const testJSON = {
        standard: 'EDIFACT',
        segments: [
          {
            tag: 'UNB',
            elements: [
              { value: 'UNOC:3' },
              { value: 'SENDER' },
              { value: 'RECEIVER' },
              { value: '20240124:1200' },
              { value: '1' },
            ],
          },
          {
            tag: 'UNH',
            elements: [
              { value: '1' },
              { value: 'ORDERS:D:96A:UN' },
            ],
          },
          {
            tag: 'UNT',
            elements: [
              { value: '2' },
              { value: '1' },
            ],
          },
          {
            tag: 'UNZ',
            elements: [
              { value: '1' },
              { value: '1' },
            ],
          },
        ],
      };

      writeFileSync(testFile, JSON.stringify(testJSON, null, 2));

      const result = await simulateBuildExecution(testFile, {});

      expect(result).toBeDefined();
      expect(result).toContain('UNB');
      expect(result).toContain('UNH');
      expect(result).toContain('ORDERS');
    });

    it('should build minimal EDIFACT message', async () => {
      const minimalJSON = {
        standard: 'EDIFACT',
        segments: [
          {
            tag: 'UNB',
            elements: [
              { value: 'UNOC:3' },
              { value: 'SENDER' },
              { value: 'RECEIVER' },
              { value: '20240124:1200' },
              { value: '1' },
            ],
          },
          {
            tag: 'UNZ',
            elements: [
              { value: '1' },
              { value: '1' },
            ],
          },
        ],
      };

      writeFileSync(testFile, JSON.stringify(minimalJSON));

      const result = await simulateBuildExecution(testFile, {});

      expect(result).toBeDefined();
      expect(result).toContain('UNB');
      expect(result).toContain('UNZ');
    });

    it('should handle explicit --standard flag', async () => {
      const testJSON = {
        standard: 'EDIFACT',
        segments: [
          {
            tag: 'UNB',
            elements: [{ value: 'UNOC:3' }],
          },
        ],
      };

      writeFileSync(testFile, JSON.stringify(testJSON));

      const result = await simulateBuildExecution(testFile, { standard: 'EDIFACT' });

      expect(result).toBeDefined();
      expect(result).toContain('UNB');
    });
  });

  describe('Output Options - File Output', () => {
    it('should return EDI string for file output', async () => {
      const testJSON = {
        standard: 'EDIFACT',
        segments: [
          {
            tag: 'UNB',
            elements: [
              { value: 'UNOC:3' },
              { value: 'SENDER' },
            ],
          },
        ],
      };

      writeFileSync(testFile, JSON.stringify(testJSON));

      const result = await simulateBuildExecution(testFile, {});

      expect(result).toBeDefined();
      expect(result).toContain('UNB');
    });
  });

  describe('Error Cases - Invalid Input', () => {
    it('should throw error for non-existent file', async () => {
      const nonExistentFile = join(testDir, 'does-not-exist.json');

      expect(simulateBuildExecution(nonExistentFile, {})).rejects.toThrow();
    });

    it('should throw error for invalid JSON', async () => {
      writeFileSync(testFile, 'this is not valid JSON {');

      expect(simulateBuildExecution(testFile, {})).rejects.toThrow();
    });

    it('should throw error for missing standard field', async () => {
      const invalidJSON = {
        segments: [],
      };

      writeFileSync(testFile, JSON.stringify(invalidJSON));

      expect(simulateBuildExecution(testFile, {})).rejects.toThrow('Missing required field: standard');
    });

    it('should throw error for empty file', async () => {
      writeFileSync(testFile, '');

      expect(simulateBuildExecution(testFile, {})).rejects.toThrow();
    });

    it('should throw error for invalid JSON structure', async () => {
      const invalidStructure = {
        standard: 'EDIFACT',
        segments: 'invalid',
      };

      writeFileSync(testFile, JSON.stringify(invalidStructure));

      expect(simulateBuildExecution(testFile, {})).rejects.toThrow();
    });
  });

  describe('Complex Messages', () => {
    it('should build message with composite elements', async () => {
      const complexJSON = {
        standard: 'EDIFACT',
        segments: [
          {
            tag: 'UNH',
            elements: [
              { value: '1' },
              {
                value: 'ORDERS:D:96A:UN',
                components: ['ORDERS', 'D', '96A', 'UN'],
              },
            ],
          },
        ],
      };

      writeFileSync(testFile, JSON.stringify(complexJSON));

      const result = await simulateBuildExecution(testFile, {});

      expect(result).toBeDefined();
      expect(result).toContain('ORDERS');
      expect(result).toContain('D');
      expect(result).toContain('96A');
    });

    it('should build large message with many segments', async () => {
      const segments = [
        {
          tag: 'UNB',
          elements: [{ value: 'UNOC:3' }, { value: 'SENDER' }],
        },
      ];

      for (let i = 0; i < 100; i++) {
        segments.push({
          tag: 'LIN',
          elements: [{ value: String(i + 1) }],
        });
      }

      segments.push({
        tag: 'UNZ',
        elements: [{ value: '1' }, { value: '1' }],
      });

      const largeJSON = {
        standard: 'EDIFACT',
        segments,
      };

      writeFileSync(testFile, JSON.stringify(largeJSON));

      const result = await simulateBuildExecution(testFile, {});

      expect(result).toBeDefined();
      expect(result).toContain('LIN');
    });
  });

  async function simulateBuildExecution(filePath: string, options: any): Promise<string> {
    const executeMethod = (buildCommand as any).execute.bind(buildCommand);
    return await executeMethod(filePath, options);
  }
});


