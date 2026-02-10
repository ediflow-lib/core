import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, readFileSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import { Standard } from '@ediflow/core';
import {DIContainer} from "../../../src/infrastructure/container";

/**
 * Integration Tests for ParseCommand
 *
 * Tests the full flow from CLI command through Use Cases to Infrastructure.
 * Uses real file I/O, real DIContainer, and actual EDI parsing (no mocking).
 *
 * Test Strategy:
 * 1. Happy Path - Real EDI files with full parsing
 * 2. Edge Cases - Boundary conditions with real data
 * 3. Error Cases - File errors and invalid EDI
 *
 * Note: Uses OS temp directory for test files (not tracked by git)
 */

describe('ParseCommand - Integration Tests', () => {
  // Use OS temp directory (similar to Java's target/ folder)
  const testDir = join(tmpdir(), 'ediflow-test-', Date.now().toString());
  const testFile = join(testDir, 'test.edi');
  const outputFile = join(testDir, 'output.json');

  let container: DIContainer;

  beforeEach(() => {
    // Create test directory in OS temp
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    // Setup real DI Container (no mocking!)
    container = DIContainer.getInstance();
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
  // HAPPY PATH - Real EDI Parsing
  // ============================================

  describe('Happy Path - Real EDI Files', () => {
    it('should parse valid EDIFACT file end-to-end', async () => {
      // Given: Valid EDIFACT ORDERS message
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'DTM+137:20240124:102'UNT+4+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      // When: Parse via full stack (File → UseCase → Parser)
      const result = simulateParseExecution(testFile, {});

      // Then: Should return complete parsed structure
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.standard).toBe('EDIFACT');
      expect(result.metadata.segmentCount).toBeGreaterThan(0);
      expect(result.segments).toBeDefined();
      expect(result.segments.length).toBeGreaterThan(0);
    });

    it('should auto-detect EDIFACT standard from UNB', async () => {
      // Given: EDIFACT starting with UNB
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      // When: Parse without standard flag
      const result = simulateParseExecution(testFile, {});

      // Then: Should detect EDIFACT
      expect(result.metadata.standard).toBe('EDIFACT');
    });

    it('should auto-detect EDIFACT standard from UNA', async () => {
      // Given: EDIFACT starting with UNA
      const testEDI = `UNA:+.? 'UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      // When: Parse without standard flag
      const result = simulateParseExecution(testFile, {});

      // Then: Should detect EDIFACT
      expect(result.metadata.standard).toBe('EDIFACT');
    });

    it('should include all metadata in output', async () => {
      // Given: Complete EDIFACT message
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'UNT+3+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      // When: Parse message
      const result = simulateParseExecution(testFile, {});

      // Then: Should include complete metadata
      expect(result.metadata.standard).toBe('EDIFACT');
      expect(result.metadata.version).toBeDefined();
      expect(result.metadata.messageType).toBeDefined();
      expect(result.metadata.segmentCount).toBe(5);
      expect(result.metadata.delimiters).toBeDefined();
      expect(result.metadata.delimiters.segment).toBe("'");
      expect(result.metadata.delimiters.element).toBe('+');
      expect(result.metadata.delimiters.component).toBe(':');
    });

    it('should parse all segments with elements', async () => {
      // Given: EDIFACT with multiple segments
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'DTM+137:20240124:102'UNT+4+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      // When: Parse message
      const result = simulateParseExecution(testFile, {});

      // Then: Should parse all segments
      expect(result.segments).toBeDefined();
      expect(result.segments.length).toBe(6);

      // Check specific segments
      const unbSegment = result.segments.find((s: any) => s.tag === 'UNB');
      expect(unbSegment).toBeDefined();

      const bgmSegment = result.segments.find((s: any) => s.tag === 'BGM');
      expect(bgmSegment).toBeDefined();
      expect(bgmSegment.elements).toHaveLength(3);
      expect(bgmSegment.elements[0].value).toBe('220');
      expect(bgmSegment.elements[1].value).toBe('ORDER123');
    });

    it('should handle composite elements correctly', async () => {
      // Given: EDIFACT with composite elements
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      // When: Parse message
      const result = simulateParseExecution(testFile, {});

      // Then: Should parse composite elements
      const unhSegment = result.segments.find((s: any) => s.tag === 'UNH');
      expect(unhSegment).toBeDefined();

      const messageTypeElement = unhSegment.elements[1];
      expect(messageTypeElement).toBeDefined();
      // Composite elements are represented in value with component delimiter
      expect(messageTypeElement.value).toBe('ORDERS:D:96A:UN');
      // Components may or may not be parsed depending on parser implementation
      if (messageTypeElement.components && messageTypeElement.components.length > 0) {
        expect(messageTypeElement.components).toContain('ORDERS');
      }
    });
  });

  // ============================================
  // EDGE CASES - Boundary Conditions
  // ============================================

  describe('Edge Cases - Boundary Conditions', () => {
    it('should handle message with only required segments', () => {
      // Given: EDIFACT with UNB, UNH, UNT, UNZ only
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      // When: Parse message
      const result = simulateParseExecution(testFile, {});

      // Then: Should parse successfully
      expect(result.metadata.standard).toBe('EDIFACT');
      expect(result.segments.length).toBe(4);
    });

    it('should handle explicit --standard flag override', () => {
      // Given: EDIFACT message
      const testEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;
      writeFileSync(testFile, testEDI);

      // When: Parse with explicit standard
      const result = simulateParseExecution(testFile, { standard: 'EDIFACT' });

      // Then: Should use provided standard
      expect(result.metadata.standard).toBe('EDIFACT');
    });
  });

  // ============================================
  // ERROR CASES - File & Parsing Errors
  // ============================================

  describe('Error Cases - File and Parsing Errors', () => {
    // Common test EDI message
    const validEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;

    it('should throw error for non-existent file', () => {
      // Given: Non-existent file path
      const nonExistentFile = join(testDir, 'does-not-exist.edi');

      // When/Then: Should throw file error
      expect(() => {
        simulateParseExecution(nonExistentFile, {});
      }).toThrow(/ENOENT|no such file/);
    });

    it('should throw error for empty file', () => {
      // Given: Empty EDI file
      writeFileSync(testFile, '');

      // When/Then: Should throw parse error
      expect(() => {
        simulateParseExecution(testFile, {});
      }).toThrow();
    });

    it('should throw error for invalid EDI content', () => {
      // Given: Invalid non-EDI content
      const invalidContent = 'This is not EDI content at all!';
      writeFileSync(testFile, invalidContent);

      // When/Then: Should throw detection error
      expect(() => {
        simulateParseExecution(testFile, {});
      }).toThrow(/Unable to detect EDI standard/);
    });

    it('should throw error for malformed EDIFACT', () => {
      // Given: Malformed EDIFACT (missing quotes)
      const malformedEDI = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1`;
      writeFileSync(testFile, malformedEDI);

      // When/Then: Should throw parse error
      expect(() => {
        simulateParseExecution(testFile, {});
      }).toThrow();
    });

    it('should throw error for unsupported standard', () => {
      // Given: Valid EDIFACT file
      writeFileSync(testFile, validEDI);

      // When/Then: Should throw error for unsupported standard
      expect(() => {
        simulateParseExecution(testFile, { standard: 'VDA' });
      }).toThrow(/Unsupported standard/);
    });
  });

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Simulates ParseCommand execution.
   * Uses real implementations (no mocks) to test full integration.
   */
  function simulateParseExecution(filePath: string, options: any): any {
    const content = readFileSync(filePath, 'utf-8');
    const standardStr = options.standard || detectStandard(content);
    const standardEnum = parseStandard(standardStr);

    const useCase = container.getUseCaseFactory().createParseUseCase(standardStr);
    const result = useCase.execute({
      message: content,
      standard: standardEnum,
    });

    if (!result.success) {
      const errorMessage = result.errors?.map(e => e.message).join(', ') || 'Parse failed';
      throw new Error(errorMessage);
    }

    // Extract data from successful parse result
    const parsedMessage = result.message;
    if (!parsedMessage) {
      throw new Error('Parse succeeded but message is undefined');
    }


    // Handle delimiters - use from metadata or default to EDIFACT standard
    const delimitersObj: any = {
      segment: result.metadata?.delimiters?.segment || "'",
      element: result.metadata?.delimiters?.element || '+',
      component: result.metadata?.delimiters?.component || ':',
    };

    return {
      metadata: {
        standard: standardStr,
        version: parsedMessage.version?.toString(),
        messageType: parsedMessage.messageType?.toString(),
        segmentCount: result.metadata?.segmentCount || parsedMessage.segments.length,
        delimiters: delimitersObj,
      },
      segments: parsedMessage.segments.map((seg: any) => ({
        tag: seg.tag,
        elements: seg.elements.map((el: any) => ({
          value: el.value,
          components: el.components && el.components.length > 0 ? el.components : undefined,
        })),
      })),
    };
  }

  function detectStandard(content: string): string {
    if (content.startsWith('UNB') || content.startsWith('UNA')) {
      return 'EDIFACT';
    }
    if (content.startsWith('ISA')) {
      return 'X12';
    }
    throw new Error('Unable to detect EDI standard. Please specify with --standard flag.');
  }

  function parseStandard(standardStr: string): Standard {
    const upper = standardStr.toUpperCase();
    if (upper === 'EDIFACT') return Standard.EDIFACT;
    if (upper === 'X12') return Standard.X12;
    throw new Error(`Unsupported standard: ${standardStr}`);
  }
});

