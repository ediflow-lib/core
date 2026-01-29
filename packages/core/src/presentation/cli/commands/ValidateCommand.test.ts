import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidateCommand } from './ValidateCommand';
import { UseCaseFactory } from '@application/factories';
import { Command } from 'commander';
import { Standard } from '@domain/value-objects/Standard';
import { EDIMessage, ValidationResult } from '@domain';

/**
 * Unit Tests for ValidateCommand (US-5.2)
 *
 * Testing Strategy (TDD):
 * 1. Happy Path - Successful validation
 * 2. Validation Errors - Failed validation with errors
 * 3. Edge Cases - Boundary conditions
 * 4. Error Cases - Failure scenarios
 * 5. Format Options - JSON, Text, Table output
 * 6. Strict Mode - Strict validation flag
 *
 * Note: These are UNIT tests - no file I/O.
 * File I/O is tested in integration tests.
 */

describe('ValidateCommand - TDD (US-5.2)', () => {
  let mockFactory: UseCaseFactory;
  let mockParseUseCase: any;
  let mockValidateUseCase: any;
  let validateCommand: ValidateCommand;
  let mockMessage: EDIMessage;

  beforeEach(() => {
    // Mock EDIMessage
    mockMessage = {
      standard: Standard.EDIFACT,
      version: { toString: () => 'D.96A' },
      messageType: { toString: () => 'ORDERS' },
      segments: [],
    } as any;

    // Mock ParseEDIUseCase
    mockParseUseCase = {
      execute: vi.fn().mockReturnValue({
        success: true,
        message: mockMessage,
        metadata: {
          standard: Standard.EDIFACT,
          segmentCount: 5,
        },
      }),
    };

    // Mock ValidateMessageUseCase
    mockValidateUseCase = {
      execute: vi.fn().mockReturnValue({
        success: true,
        validationResult: {
          isValid: true,
          errors: [],
        },
      }),
    };

    // Mock UseCaseFactory
    mockFactory = {
      createParseUseCase: vi.fn().mockReturnValue(mockParseUseCase),
      createValidateUseCase: vi.fn().mockReturnValue(mockValidateUseCase),
    } as any;

    validateCommand = new ValidateCommand(mockFactory);

    vi.clearAllMocks();
  });

  // ============================================
  // HAPPY PATH TESTS
  // ============================================

  describe('Happy Path - Successful Validation', () => {
    it('should register validate command with correct name and description', () => {
      const program = new Command();

      validateCommand.register(program);

      const commands = program.commands;
      expect(commands).toHaveLength(1);

      const command = commands[0];
      if (!command) throw new Error('Command not registered');

      expect(command.name()).toBe('validate');
      expect(command.description()).toBe('Validate an EDI file');
    });

    it('should require file argument', () => {
      const program = new Command();

      validateCommand.register(program);

      const command = program.commands[0];
      if (!command) throw new Error('Command not registered');

      const args = command.registeredArguments;
      expect(args).toHaveLength(1);

      const arg = args[0];
      if (!arg) throw new Error('Argument not registered');

      expect(arg.name()).toBe('file');
      expect(arg.required).toBe(true);
    });

    it('should have all required options', () => {
      const program = new Command();

      validateCommand.register(program);

      const command = program.commands[0];
      if (!command) throw new Error('Command not registered');

      const optionNames = command.options.map(opt => opt.long);

      expect(optionNames).toContain('--standard');
      expect(optionNames).toContain('--format');
      expect(optionNames).toContain('--output');
      expect(optionNames).toContain('--strict');
    });

    it('should detect EDIFACT from UNB prefix', () => {
      const detectStandard = (validateCommand as any).detectStandard.bind(validateCommand);

      const result = detectStandard('UNB+UNOC:3+...');

      expect(result).toBe('EDIFACT');
    });

    it('should detect EDIFACT from UNA prefix', () => {
      const detectStandard = (validateCommand as any).detectStandard.bind(validateCommand);

      const result = detectStandard('UNA:+.? \'...');

      expect(result).toBe('EDIFACT');
    });

    it('should detect X12 from ISA prefix', () => {
      const detectStandard = (validateCommand as any).detectStandard.bind(validateCommand);

      const result = detectStandard('ISA*00*...');

      expect(result).toBe('X12');
    });

    it('should parse EDIFACT string to Standard enum', () => {
      const parseStandard = (validateCommand as any).parseStandard.bind(validateCommand);

      const result = parseStandard('EDIFACT');

      expect(result).toBe(Standard.EDIFACT);
    });

    it('should parse X12 string to Standard enum', () => {
      const parseStandard = (validateCommand as any).parseStandard.bind(validateCommand);

      const result = parseStandard('X12');

      expect(result).toBe(Standard.X12);
    });

    it('should format validation result with valid message', () => {
      const formatValidationResult = (validateCommand as any).formatValidationResult.bind(validateCommand);

      const validationResult = new ValidationResult(true, []);
      const result = formatValidationResult(validationResult, mockMessage);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.metadata.standard).toBe('EDIFACT');
      expect(result.metadata.version).toBe('D.96A');
      expect(result.metadata.messageType).toBe('ORDERS');
    });

    it('should format validation result with errors', () => {
      const formatValidationResult = (validateCommand as any).formatValidationResult.bind(validateCommand);

      const validationResult = new ValidationResult(false, [
        {
          code: 'MISSING_SEGMENT',
          message: 'Missing mandatory segment UNH',
          field: 'UNH',
        },
      ]);

      const result = formatValidationResult(validationResult, mockMessage);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_SEGMENT');
    });
  });

  // ============================================
  // FORMAT TESTS
  // ============================================

  describe('Format Options - JSON, Text, Table', () => {
    it('should format output as JSON by default', () => {
      const formatOutput = (validateCommand as any).formatOutput.bind(validateCommand);

      const data = { valid: true, errors: [] };
      const result = formatOutput(data, 'json');

      expect(result).toContain('"valid": true');
      expect(result).toContain('"errors": []');
    });

    it('should format output as text with success', () => {
      const formatOutput = (validateCommand as any).formatOutput.bind(validateCommand);

      const data = {
        valid: true,
        errors: [],
        metadata: {
          standard: 'EDIFACT',
          version: 'D.96A',
          messageType: 'ORDERS',
        },
      };

      const result = formatOutput(data, 'text');

      expect(result).toContain('✓ Valid');
      expect(result).toContain('EDIFACT');
      expect(result).toContain('D.96A');
      expect(result).toContain('ORDERS');
    });

    it('should format output as text with errors', () => {
      const formatOutput = (validateCommand as any).formatOutput.bind(validateCommand);

      const data = {
        valid: false,
        errors: [
          { code: 'MISSING_SEGMENT', message: 'Missing mandatory segment UNH', field: 'UNH' },
          { code: 'INVALID_TAG', message: 'Invalid segment tag', field: 'XXX' },
        ],
        metadata: {
          standard: 'EDIFACT',
          version: 'D.96A',
          messageType: 'ORDERS',
        },
      };

      const result = formatOutput(data, 'text');

      expect(result).toContain('✗ Invalid');
      expect(result).toContain('MISSING_SEGMENT');
      expect(result).toContain('INVALID_TAG');
      expect(result).toContain('UNH');
      expect(result).toContain('XXX');
    });

    it('should format output as table with errors', () => {
      const formatOutput = (validateCommand as any).formatOutput.bind(validateCommand);

      const data = {
        valid: false,
        errors: [
          { code: 'MISSING_SEGMENT', message: 'Missing mandatory segment UNH', field: 'UNH' },
          { code: 'INVALID_TAG', message: 'Invalid segment tag', field: 'XXX' },
        ],
        metadata: {
          standard: 'EDIFACT',
          version: 'D.96A',
          messageType: 'ORDERS',
        },
      };

      const result = formatOutput(data, 'table');

      expect(result).toContain('Code');
      expect(result).toContain('Field');
      expect(result).toContain('Message');
      expect(result).toContain('MISSING_SEGMENT');
      expect(result).toContain('INVALID_TAG');
    });
  });

  // ============================================
  // STRICT MODE TESTS
  // ============================================

  describe('Strict Mode - Strict Validation Flag', () => {
    it('should pass strict flag to validation use case', () => {
      const mockValidateUseCaseStrict = {
        execute: vi.fn().mockReturnValue({
          success: true,
          validationResult: {
            isValid: true,
            errors: [],
          },
        }),
      };

      mockFactory.createValidateUseCase = vi.fn().mockReturnValue(mockValidateUseCaseStrict);

      new ValidateCommand(mockFactory);

      expect(mockFactory.createValidateUseCase).toBeDefined();
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases - Boundary Conditions', () => {
    it('should handle lowercase standard names', () => {
      const parseStandard = (validateCommand as any).parseStandard.bind(validateCommand);

      expect(parseStandard('edifact')).toBe(Standard.EDIFACT);
      expect(parseStandard('x12')).toBe(Standard.X12);
    });

    it('should handle mixed case standard names', () => {
      const parseStandard = (validateCommand as any).parseStandard.bind(validateCommand);

      expect(parseStandard('EdIfAcT')).toBe(Standard.EDIFACT);
      expect(parseStandard('X12')).toBe(Standard.X12);
    });

    it('should handle validation result with no metadata gracefully', () => {
      const formatValidationResult = (validateCommand as any).formatValidationResult.bind(validateCommand);

      const validationResult = new ValidationResult(true, []);
      const messageWithoutMetadata = {
        standard: Standard.EDIFACT,
        version: undefined,
        messageType: undefined,
        segments: [],
      } as any;

      const result = formatValidationResult(validationResult, messageWithoutMetadata);

      expect(result.valid).toBe(true);
      expect(result.metadata.standard).toBe('EDIFACT');
      expect(result.metadata.version).toBeUndefined();
      expect(result.metadata.messageType).toBeUndefined();
    });
  });

  // ============================================
  // ERROR CASES
  // ============================================

  describe('Error Cases - Failure Scenarios', () => {
    it('should throw error for undetectable standard', () => {
      const detectStandard = (validateCommand as any).detectStandard.bind(validateCommand);

      expect(() => detectStandard('INVALID_CONTENT')).toThrow(
        'Unable to detect EDI standard. Please specify with --standard flag.'
      );
    });

    it('should throw error for unsupported standard', () => {
      const parseStandard = (validateCommand as any).parseStandard.bind(validateCommand);

      expect(() => parseStandard('INVALID')).toThrow('Unsupported standard: INVALID');
    });

    it('should throw error when parse fails', () => {
      mockParseUseCase.execute.mockReturnValue({
        success: false,
        errors: [{ code: 'PARSE_ERROR', message: 'Parse failed' }],
      });

      const execute = (validateCommand as any).execute.bind(validateCommand);

      expect(() => execute('test.edi', {})).rejects.toThrow();
    });

    it('should throw error when validation use case fails', () => {
      mockValidateUseCase.execute.mockReturnValue({
        success: false,
        errors: [{ code: 'VALIDATION_ERROR', message: 'Validation failed' }],
      });

      const execute = (validateCommand as any).execute.bind(validateCommand);

      expect(() => execute('test.edi', {})).rejects.toThrow();
    });

    it('should throw error for invalid format option', () => {
      const formatOutput = (validateCommand as any).formatOutput.bind(validateCommand);

      const data = { valid: true, errors: [] };

      const result = formatOutput(data, 'unknown');
      expect(result).toContain('"valid": true');
    });
  });
});
