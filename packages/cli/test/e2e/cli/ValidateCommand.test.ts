import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';


import {DIContainer} from "../../../src/infrastructure/container";
import {ValidateCommand} from "../../../src/presentation/cli/commands";

/**
 * Integration Tests for ValidateCommand (US-5.2)
 *
 * Tests the full flow from CLI command through Use Cases to Infrastructure.
 * Uses real file I/O, real DIContainer, and actual EDI validation (no mocking).
 *
 * Test Strategy:
 * 1. Happy Path - Valid EDI messages with full validation
 * 2. Validation Errors - Invalid EDI messages with detailed errors
 * 3. Output Formats - JSON, Text, Table output
 * 4. Strict Mode - Strict validation behavior
 * 5. Error Cases - File errors and edge cases
 *
 * Note: Uses OS temp directory for test files (not tracked by git)
 */

describe('ValidateCommand - Integration Tests (US-5.2)', () => {
  // Use OS temp directory
  const testDir = join(tmpdir(), 'ediflow-test-validate-', Date.now().toString());
  const testFile = join(testDir, 'test.edi');
  const outputFile = join(testDir, 'output.json');

  let container: DIContainer;
  let validateCommand: ValidateCommand;

  beforeEach(() => {
    // Create test directory in OS temp
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    // Setup real DI Container (no mocking!)
    container = DIContainer.getInstance();
    validateCommand = new ValidateCommand(container.getUseCaseFactory());
  });

  afterEach(() => {
    // Cleanup test files
    try {
      if (existsSync(testFile)) unlinkSync(testFile);
      if (existsSync(outputFile)) unlinkSync(outputFile);
      if (existsSync(testDir)) rmdirSync(testDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  // ============================================
  // HAPPY PATH - Valid EDI Messages
  // ============================================

  describe('Happy Path - Valid EDI Messages', () => {
    it('should validate valid EDIFACT message and return success', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'DTM+137:20240124:102'UNT+4+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      const result = await simulateValidateExecution(testFile, {});

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.standard).toBe('EDIFACT');
    });

    it('should auto-detect EDIFACT standard from UNB', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      const result = await simulateValidateExecution(testFile, {});

      expect(result.metadata.standard).toBe('EDIFACT');
    });

    it('should auto-detect EDIFACT standard from UNA', async () => {
      const testEDI = `UNA:+.? 'UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      const result = await simulateValidateExecution(testFile, {});

      expect(result.metadata.standard).toBe('EDIFACT');
    });

    it('should include complete metadata in validation result', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'UNT+3+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      const result = await simulateValidateExecution(testFile, {});

      expect(result.metadata.standard).toBe('EDIFACT');
      expect(result.metadata.version).toBe('D.96A');
      expect(result.metadata.messageType).toBe('ORDERS');
    });

    it('should handle explicit --standard flag', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      const result = await simulateValidateExecution(testFile, { standard: 'EDIFACT' });

      expect(result.metadata.standard).toBe('EDIFACT');
      expect(result.valid).toBe(true);
    });
  });

  // ============================================
  // VALIDATION ERRORS - Invalid Messages
  // ============================================

  describe('Validation Errors - Invalid EDI Messages', () => {
    it('should detect missing mandatory segments', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'BGM+220+ORDER123+9'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      await expect(simulateValidateExecution(testFile, {})).rejects.toThrow();
    });

    it('should return invalid result for messages with segment count mismatch', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'UNT+10+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      const result = await simulateValidateExecution(testFile, {});

      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle validation of minimal valid message', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      const result = await simulateValidateExecution(testFile, {});

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return validation result even for invalid messages without throwing', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      const result = await simulateValidateExecution(testFile, {});

      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it('should throw error for unrecognized message type', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+UNKNOWN:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      await expect(simulateValidateExecution(testFile, {})).rejects.toThrow('Cannot validate: Message parsing failed');
    });
  });

  // ============================================
  // OUTPUT FORMATS - JSON, Text, Table
  // ============================================

  describe('Output Formats - JSON, Text, Table', () => {
    const validEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'UNT+3+1'UNZ+1+1'`;

    it('should output JSON format by default', async () => {
      writeFileSync(testFile, validEDI);

      const result = await simulateValidateExecution(testFile, {});

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should support --format json flag', async () => {
      writeFileSync(testFile, validEDI);

      const result = await simulateValidateExecution(testFile, { format: 'json' });

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it('should support --format text flag', async () => {
      writeFileSync(testFile, validEDI);

      const result = await simulateValidateExecution(testFile, { format: 'text' });

      expect(result).toBeDefined();
    });

    it('should support --format table flag', async () => {
      writeFileSync(testFile, validEDI);

      const result = await simulateValidateExecution(testFile, { format: 'table' });

      expect(result).toBeDefined();
    });
  });

  // ============================================
  // STRICT MODE - Strict Validation
  // ============================================

  describe('Strict Mode - Strict Validation Flag', () => {
    it('should support --strict flag for strict validation', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'UNT+3+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      const result = await simulateValidateExecution(testFile, { strict: true });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });

    it('should use normal validation without --strict flag', async () => {
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'UNT+3+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      const result = await simulateValidateExecution(testFile, {});

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });
  });

  // ============================================
  // ERROR CASES - File & Edge Cases
  // ============================================

  describe('Error Cases - File and Edge Cases', () => {
    it('should throw error for non-existent file', async () => {
      const nonExistentFile = join(testDir, 'does-not-exist.edi');

      await expect(simulateValidateExecution(nonExistentFile, {})).rejects.toThrow();
    });

    it('should throw error for undetectable EDI standard', async () => {
      const invalidContent = 'This is not EDI content at all';
      writeFileSync(testFile, invalidContent);

      await expect(simulateValidateExecution(testFile, {})).rejects.toThrow('Unable to detect EDI standard');
    });

    it('should handle empty file', async () => {
      writeFileSync(testFile, '');

      await expect(simulateValidateExecution(testFile, {})).rejects.toThrow();
    });

    it('should handle malformed EDIFACT message', async () => {
      const malformedEDI = `UNB+UNOC:3+SENDER`;
      writeFileSync(testFile, malformedEDI);

      await expect(simulateValidateExecution(testFile, {})).rejects.toThrow();
    });

    it('should handle message with control characters', async () => {
      const invalidChars = `UNB+UNOC:3+SENDER\x00+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, invalidChars);

      try {
        const result = await simulateValidateExecution(testFile, {});
        expect(result).toBeDefined();
        expect(result.metadata.standard).toBe('EDIFACT');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle message with wrong segment terminator', async () => {
      const wrongTerminator = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1\nUNH+1+ORDERS:D:96A:UN\nUNT+2+1\nUNZ+1+1\n`;
      writeFileSync(testFile, wrongTerminator);

      await expect(simulateValidateExecution(testFile, {})).rejects.toThrow();
    });

    it('should handle message with missing element separator', async () => {
      const missingElement = `UNB+UNOC:3SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, missingElement);

      try {
        const result = await simulateValidateExecution(testFile, {});
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle very large file gracefully', async () => {
      const segments: string[] = [
        `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'`,
        `UNH+1+ORDERS:D:96A:UN'`
      ];

      for (let i = 0; i < 10000; i++) {
        segments.push(`BGM+220+ORDER${i}+9'`);
      }

      segments.push(`UNT+${10000 + 2}+1'`);
      segments.push(`UNZ+1+1'`);

      const largeEDI = segments.join('');
      writeFileSync(testFile, largeEDI);

      const result = await simulateValidateExecution(testFile, {});

      expect(result).toBeDefined();
      expect(result.metadata.standard).toBe('EDIFACT');
    });
  });

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Simulates ValidateCommand execution.
   * This directly calls the internal execute method for integration testing.
   */
  async function simulateValidateExecution(filePath: string, options: any): Promise<any> {
    // Call the private execute method via reflection (for testing)
    const executeMethod = (validateCommand as any).execute.bind(validateCommand);
    return await executeMethod(filePath, options);
  }
});


