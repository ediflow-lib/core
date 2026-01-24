import { describe, it, expect } from 'vitest';
import { loadValidFixture } from '../fixture-loader';
import { ParseEDIUseCase } from '../../../src/application/use-cases/parse/ParseEDIUseCase';
import { Standard } from '@domain';
import { EdifactMessageParser } from '@infrastructure/parsers/edifact/EdifactMessageParser';
import { EdifactSegmentParser } from '@infrastructure/parsers/edifact/EdifactSegmentParser';
import { EdifactTokenizer } from '@infrastructure/parsers/edifact/EdifactTokenizer';
import { EdifactDelimiterDetector } from '@infrastructure/parsers/edifact/EdifactDelimiterDetector';

describe('Integration: ParseEDIUseCase (Application Layer)', () => {
  function createUseCase(): ParseEDIUseCase {
    // Create complete infrastructure
    const delimiterDetector = new EdifactDelimiterDetector();
    const tokenizer = new EdifactTokenizer();
    const segmentParser = new EdifactSegmentParser();

    // EdifactMessageParser is now IMessageParser
    const messageParser = new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);

    // Use Case takes IMessageParser (Clean Architecture!)
    return new ParseEDIUseCase(messageParser);
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
