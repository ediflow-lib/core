import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParseEDIUseCase } from '@application';
import { ParseEDIInputDTO } from './ParseEDIInputDTO';
import { IMessageParser } from '@application/ports';
import type { ParserConfig } from '@application/configuration';
import { Standard, EDIMessage, Version, MessageType } from '@domain';
describe('ParseEDIUseCase', () => {
  let useCase: ParseEDIUseCase;
  let mockMessageParser: IMessageParser;
  beforeEach(() => {
    mockMessageParser = {
      parse: vi.fn(),
      getSupportedStandard: vi.fn().mockReturnValue(Standard.EDIFACT),
      canParse: vi.fn().mockReturnValue(true),
      getConfiguration: vi.fn().mockReturnValue({}),
    };
    useCase = new ParseEDIUseCase(mockMessageParser);
  });
  describe('execute', () => {
    it('should parse message successfully via IMessageParser', () => {
      const mockMessage = new EDIMessage('mock-id', Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'), new MessageType(Standard.EDIFACT, 'ORDERS'));
      mockMessageParser.parse = vi.fn().mockReturnValue(mockMessage);
      mockMessageParser.canParse = vi.fn().mockReturnValue(true);
      const input: ParseEDIInputDTO = { message: "UNH+1+ORDERS:D:96A:UN'BGM+220'UNT+3+1'", standard: Standard.EDIFACT };
      const result = useCase.execute(input);
      expect(result.success).toBe(true);
    });
    it('should return error for empty message', () => {
      const input: ParseEDIInputDTO = { message: '', standard: Standard.EDIFACT };
      const result = useCase.execute(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.code).toBe('EMPTY_MESSAGE');
      }
    });
    it('should return error if parser cannot parse', () => {
      mockMessageParser.canParse = vi.fn().mockReturnValue(false);
      const input: ParseEDIInputDTO = { message: 'SOME_MESSAGE', standard: Standard.EDIFACT };
      const result = useCase.execute(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.code).toBe('UNSUPPORTED_FORMAT');
      }
    });
    it('should return error if parsing throws exception', () => {
      mockMessageParser.canParse = vi.fn().mockReturnValue(true);
      mockMessageParser.parse = vi.fn().mockImplementation(() => { throw new Error('Invalid'); });
      const input: ParseEDIInputDTO = { message: 'INVALID', standard: Standard.EDIFACT };
      const result = useCase.execute(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.code).toBe('PARSE_ERROR');
      }
    });

    it('should pass ParserConfig to parser when provided', () => {
      const mockMessage = new EDIMessage('mock-id', Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'), new MessageType(Standard.EDIFACT, 'ORDERS'));
      const parseSpy = vi.fn().mockReturnValue(mockMessage);
      mockMessageParser.parse = parseSpy;
      mockMessageParser.canParse = vi.fn().mockReturnValue(true);

      const parserConfig: ParserConfig = {
        propertyParseMode: 'name',
        codeListValueParseMode: 'code',
      };

      const input: ParseEDIInputDTO = {
        message: "UNH+1+ORDERS:D:96A:UN'BGM+220'UNT+3+1'",
        standard: Standard.EDIFACT,
        parserConfig,
      };

      const result = useCase.execute(input);

      expect(result.success).toBe(true);
      expect(parseSpy).toHaveBeenCalledWith(input.message, parserConfig);
    });

    it('should work without ParserConfig (backward compatibility)', () => {
      const mockMessage = new EDIMessage('mock-id', Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'), new MessageType(Standard.EDIFACT, 'ORDERS'));
      const parseSpy = vi.fn().mockReturnValue(mockMessage);
      mockMessageParser.parse = parseSpy;
      mockMessageParser.canParse = vi.fn().mockReturnValue(true);

      const input: ParseEDIInputDTO = {
        message: "UNH+1+ORDERS:D:96A:UN'BGM+220'UNT+3+1'",
        standard: Standard.EDIFACT,
      };

      const result = useCase.execute(input);

      expect(result.success).toBe(true);
      expect(parseSpy).toHaveBeenCalledWith(input.message, undefined);
    });
  });
});
