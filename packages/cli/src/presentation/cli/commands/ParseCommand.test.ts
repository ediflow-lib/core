import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParseCommand } from './ParseCommand';
import { UseCaseFactory } from '@ediflow/core';
import { Command } from 'commander';
import { Standard } from '@ediflow/core';

/**
 * Unit Tests for ParseCommand
 *
 * Testing Strategy (TDD):
 * 1. Happy Path - Normal successful usage
 * 2. Edge Cases - Boundary conditions
 * 3. Error Cases - Failure scenarios
 *
 * Note: These are UNIT tests - no file I/O or external dependencies.
 * File I/O is tested in integration tests.
 */

describe('ParseCommand - TDD', () => {
  let mockFactory: UseCaseFactory;
  let mockParseUseCase: any;
  let parseCommand: ParseCommand;

  beforeEach(() => {
    // Mock ParseEDIUseCase
    mockParseUseCase = {
      execute: vi.fn(),
    };

    // Mock UseCaseFactory
    mockFactory = {
      createParseUseCase: vi.fn().mockReturnValue(mockParseUseCase),
    } as any;

    parseCommand = new ParseCommand(mockFactory);

    vi.clearAllMocks();
  });

  // ============================================
  // HAPPY PATH TESTS
  // ============================================

  describe('Happy Path - Normal Usage', () => {
    it('should register parse command with correct name and description', () => {
      const program = new Command();

      parseCommand.register(program);

      const commands = program.commands;
      expect(commands).toHaveLength(1);

      const command = commands[0];
      if (!command) throw new Error('Command not registered');

      expect(command.name()).toBe('parse');
      expect(command.description()).toBe('Parse an EDI file');
    });

    it('should require file argument', () => {
      const program = new Command();

      parseCommand.register(program);

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

      parseCommand.register(program);

      const command = program.commands[0];
      if (!command) throw new Error('Command not registered');

      const optionNames = command.options.map(opt => opt.long);

      expect(optionNames).toContain('--standard');
      expect(optionNames).toContain('--format');
      expect(optionNames).toContain('--output');
      expect(optionNames).toContain('--property-parse-mode');
      expect(optionNames).toContain('--codelist-value-parse-mode');
    });

    it('should detect EDIFACT from UNB prefix', () => {
      const detectStandard = (parseCommand as any).detectStandard.bind(parseCommand);

      const result = detectStandard('UNB+UNOC:3+...');

      expect(result).toBe('EDIFACT');
    });

    it('should detect EDIFACT from UNA prefix', () => {
      const detectStandard = (parseCommand as any).detectStandard.bind(parseCommand);

      const result = detectStandard('UNA:+.? \'...');

      expect(result).toBe('EDIFACT');
    });

    it('should detect X12 from ISA prefix', () => {
      const detectStandard = (parseCommand as any).detectStandard.bind(parseCommand);

      const result = detectStandard('ISA*00*...');

      expect(result).toBe('X12');
    });

    it('should parse EDIFACT string to Standard enum', () => {
      const parseStandard = (parseCommand as any).parseStandard.bind(parseCommand);

      const result = parseStandard('EDIFACT');

      expect(result).toBe(Standard.EDIFACT);
    });

    it('should parse X12 string to Standard enum', () => {
      const parseStandard = (parseCommand as any).parseStandard.bind(parseCommand);

      const result = parseStandard('X12');

      expect(result).toBe(Standard.X12);
    });

    it('should format result with metadata and segments', () => {
      const formatResult = (parseCommand as any).formatResult.bind(parseCommand);

      const mockResult = {
        success: true,
        metadata: {
          standard: Standard.EDIFACT,
          segmentCount: 5,
          delimiters: {
            segment: "'",
            element: '+',
            component: ':',
          },
        },
        message: {
          version: { toString: () => 'D.96A' },
          messageType: { toString: () => 'ORDERS' },
          segments: [
            {
              tag: 'UNH',
              elements: [
                { value: '1', components: [] },
                { value: 'ORDERS', components: ['D', '96A', 'UN'] },
              ],
            },
          ],
        },
      };

      const result = formatResult(mockResult);

      expect(result.metadata.standard).toBe('EDIFACT');
      expect(result.metadata.version).toBe('D.96A');
      expect(result.metadata.messageType).toBe('ORDERS');
      expect(result.metadata.segmentCount).toBe(5);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].tag).toBe('UNH');
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases - Boundary Conditions', () => {
    it('should handle lowercase standard names', () => {
      const parseStandard = (parseCommand as any).parseStandard.bind(parseCommand);

      expect(parseStandard('edifact')).toBe(Standard.EDIFACT);
      expect(parseStandard('x12')).toBe(Standard.X12);
    });

    it('should handle mixed case standard names', () => {
      const parseStandard = (parseCommand as any).parseStandard.bind(parseCommand);

      expect(parseStandard('EdIfAcT')).toBe(Standard.EDIFACT);
      expect(parseStandard('X12')).toBe(Standard.X12);
    });

    it('should handle EDIFACT content with whitespace before UNB', () => {
      const detectStandard = (parseCommand as any).detectStandard.bind(parseCommand);

      // Note: Current implementation doesn't trim, this tests actual behavior
      expect(() => detectStandard('  UNB+...')).toThrow();
    });

    it('should handle empty segments array in result', () => {
      const formatResult = (parseCommand as any).formatResult.bind(parseCommand);

      const mockResult = {
        success: true,
        metadata: {
          standard: Standard.EDIFACT,
          segmentCount: 0,
          delimiters: { segment: "'", element: '+', component: ':' },
        },
        message: {
          version: { toString: () => 'D.96A' },
          messageType: { toString: () => 'ORDERS' },
          segments: [],
        },
      };

      const result = formatResult(mockResult);

      expect(result.segments).toHaveLength(0);
    });

    it('should handle segments without components', () => {
      const formatResult = (parseCommand as any).formatResult.bind(parseCommand);

      const mockResult = {
        success: true,
        metadata: {
          standard: Standard.EDIFACT,
          segmentCount: 1,
          delimiters: { segment: "'", element: '+', component: ':' },
        },
        message: {
          version: { toString: () => 'D.96A' },
          messageType: { toString: () => 'ORDERS' },
          segments: [
            {
              tag: 'BGM',
              elements: [
                { value: '220', components: [] },
              ],
            },
          ],
        },
      };

      const result = formatResult(mockResult);

      expect(result.segments[0].elements[0].components).toBeUndefined();
    });

    it('should handle segments with components', () => {
      const formatResult = (parseCommand as any).formatResult.bind(parseCommand);

      const mockResult = {
        success: true,
        metadata: {
          standard: Standard.EDIFACT,
          segmentCount: 1,
          delimiters: { segment: "'", element: '+', component: ':' },
        },
        message: {
          version: { toString: () => 'D.96A' },
          messageType: { toString: () => 'ORDERS' },
          segments: [
            {
              tag: 'UNH',
              elements: [
                { value: 'ORDERS', components: ['D', '96A', 'UN'] },
              ],
            },
          ],
        },
      };

      const result = formatResult(mockResult);

      expect(result.segments[0].elements[0].components).toEqual(['D', '96A', 'UN']);
    });
  });

  // ============================================
  // ERROR CASES
  // ============================================

  describe('Error Cases - Failure Scenarios', () => {
    it('should throw error for undetectable standard', () => {
      const detectStandard = (parseCommand as any).detectStandard.bind(parseCommand);

      expect(() => detectStandard('INVALID_CONTENT')).toThrow(
        'Unable to detect EDI standard. Please specify with --standard flag.'
      );
    });

    it('should throw error for empty content', () => {
      const detectStandard = (parseCommand as any).detectStandard.bind(parseCommand);

      expect(() => detectStandard('')).toThrow(
        'Unable to detect EDI standard'
      );
    });

    it('should throw error for unsupported standard', () => {
      const parseStandard = (parseCommand as any).parseStandard.bind(parseCommand);

      expect(() => parseStandard('VDA')).toThrow('Unsupported standard: VDA');
    });

    it('should throw error for unknown standard format', () => {
      const parseStandard = (parseCommand as any).parseStandard.bind(parseCommand);

      expect(() => parseStandard('IDOC')).toThrow('Unsupported standard: IDOC');
    });

    it('should throw error for null standard', () => {
      const parseStandard = (parseCommand as any).parseStandard.bind(parseCommand);

      expect(() => parseStandard(null as any)).toThrow();
    });

    it('should throw error for undefined standard', () => {
      const parseStandard = (parseCommand as any).parseStandard.bind(parseCommand);

      expect(() => parseStandard(undefined as any)).toThrow();
    });

    it('should handle result without message gracefully', () => {
      const formatResult = (parseCommand as any).formatResult.bind(parseCommand);

      const mockResult = {
        success: true,
        metadata: {
          standard: Standard.EDIFACT,
          segmentCount: 0,
          delimiters: { segment: "'", element: '+', component: ':' },
        },
        message: null,
      };

      const result = formatResult(mockResult);

      expect(result.metadata.version).toBeUndefined();
      expect(result.metadata.messageType).toBeUndefined();
      expect(result.segments).toBeUndefined();
    });
  });

  // ============================================
  // OPTIONS VALIDATION
  // ============================================

  describe('Options Configuration', () => {
    it('should have standard option with short flag -s', () => {
      const program = new Command();
      parseCommand.register(program);

      const command = program.commands[0];
      if (!command) throw new Error('Command not registered');

      const option = command.options.find(opt => opt.long === '--standard');
      expect(option).toBeDefined();
      expect(option?.short).toBe('-s');
    });

    it('should have format option with short flag -f and default json', () => {
      const program = new Command();
      parseCommand.register(program);

      const command = program.commands[0];
      if (!command) throw new Error('Command not registered');

      const option = command.options.find(opt => opt.long === '--format');
      expect(option).toBeDefined();
      expect(option?.short).toBe('-f');
      expect(option?.defaultValue).toBe('json');
    });

    it('should have output option with short flag -o', () => {
      const program = new Command();
      parseCommand.register(program);

      const command = program.commands[0];
      if (!command) throw new Error('Command not registered');

      const option = command.options.find(opt => opt.long === '--output');
      expect(option).toBeDefined();
      expect(option?.short).toBe('-o');
    });

    it('should have property-parse-mode option with default code', () => {
      const program = new Command();
      parseCommand.register(program);

      const command = program.commands[0];
      if (!command) throw new Error('Command not registered');

      const option = command.options.find(opt => opt.long === '--property-parse-mode');
      expect(option).toBeDefined();
      expect(option?.defaultValue).toBe('code');
    });

    it('should have codelist-value-parse-mode option with default code', () => {
      const program = new Command();
      parseCommand.register(program);

      const command = program.commands[0];
      if (!command) throw new Error('Command not registered');

      const option = command.options.find(opt => opt.long === '--codelist-value-parse-mode');
      expect(option).toBeDefined();
      expect(option?.defaultValue).toBe('code');
    });
  });
});
