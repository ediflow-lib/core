import { describe, it, expect, beforeAll } from 'vitest';
import { loadValidFixture } from '../FixtureLoader';
import { ParseEDIUseCase } from '@application/use-cases/parse/ParseEDIUseCase';
import { Standard } from '@domain';
import type { IMessageParser } from '@application';

/**
 * Integration tests for ParseEDIUseCase
 *
 * Phase 2 Refactoring: Tests now use IMessageParser interface instead of concrete EDIFACT implementation.
 * This allows testing with different parser implementations (EDIFACT, X12, etc.) without changing core tests.
 */
describe('Integration: ParseEDIUseCase (Application Layer)', () => {
  describe('with EDIFACT parser', () => {
    let parser: IMessageParser;

    beforeAll(async () => {
      // Dynamic import: Core tests don't depend on EDIFACT at build time
      const edifact = await import('@infrastructure/parsers/edifact');

      const delimiterDetector = new edifact.EdifactDelimiterDetector();
      const tokenizer = new edifact.EdifactTokenizer();
      const segmentParser = new edifact.EdifactSegmentParser();
      parser = new edifact.EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);
    });

    function createUseCase(): ParseEDIUseCase {
      // Use Case takes IMessageParser (Clean Architecture!)
      return new ParseEDIUseCase(parser);
    }

  describe('Happy Path', () => {
    it('should parse EDIFACT ORDERS via Use Case (Application Layer entry point)', () => {
      // GIVEN: Use Case with real EDIFACT infrastructure
      const useCase = createUseCase();
      const ordersFixture = loadValidFixture('orders-valid-d96a.edi');

      // WHEN: Execute via Application Layer Use Case
      const result = useCase.execute({
        message: ordersFixture,
        standard: Standard.EDIFACT
      });

      // THEN: Result follows discriminated union pattern
      // Type guard: assert success and TypeScript narrows the type
      if (!result.success) {
        throw new Error(`Expected success but got errors: ${JSON.stringify(result.errors)}`);
      }

      // NOW TypeScript knows: result is the SUCCESS branch of the union
      expect(result.message).toBeDefined();
      expect(result.message.standard).toBe(Standard.EDIFACT);
      expect(result.message.messageType.value).toBe('ORDERS');
      expect(result.message.version.value).toBe('D.96A');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.standard).toBe(Standard.EDIFACT);
    });

    it('should return metadata with parsing details', () => {
      // GIVEN
      const useCase = createUseCase();
      const ordersFixture = loadValidFixture('orders-valid-d96a.edi');

      // WHEN
      const result = useCase.execute({
        message: ordersFixture,
        standard: Standard.EDIFACT
      });

      // THEN: Metadata is complete
      // Type guard
      if (!result.success) {
        throw new Error(`Expected success but got errors: ${JSON.stringify(result.errors)}`);
      }

      expect(result.metadata.standard).toBe(Standard.EDIFACT);
      expect(result.metadata.version.value).toBe('D.96A');
      expect(result.metadata.messageType.value).toBe('ORDERS');
      expect(result.metadata.segmentCount).toBeGreaterThan(0);
      expect(result.metadata.delimiters).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid EDI string gracefully', () => {
      // GIVEN: Invalid EDI string
      const useCase = createUseCase();
      const invalidEdi = 'NOT_A_VALID_EDI_MESSAGE';

      // WHEN: Execute with invalid input
      const result = useCase.execute({
        message: invalidEdi,
        standard: Standard.EDIFACT
      });

      // THEN: Result indicates failure (discriminated union)
      // Type guard: assert failure
      if (result.success) {
        throw new Error('Expected failure but got success');
      }

      // NOW TypeScript knows: result is the FAILURE branch of the union
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty('code');
      expect(result.errors[0]).toHaveProperty('message');
    });

      it('should handle empty string', () => {
        // GIVEN
        const useCase = createUseCase();

        // WHEN
        const result = useCase.execute({
          message: '',
          standard: Standard.EDIFACT
        });

        // THEN
        // Type guard
        if (result.success) {
          throw new Error('Expected failure but got success');
        }

        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]?.code).toBe('EMPTY_MESSAGE');
      });
    });
  });

  // TODO: Add X12 parser tests in Sprint 10
  // describe('with X12 parser', () => { ... });
});
