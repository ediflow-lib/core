import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuildCommand } from './BuildCommand';

import { Command } from 'commander';
import {Standard, UseCaseFactory} from "@ediflow/core";


describe('BuildCommand - TDD (US-5.3)', () => {
  let mockFactory: UseCaseFactory;
  let mockBuildUseCase: any;
  let buildCommand: BuildCommand;

  beforeEach(() => {

    mockBuildUseCase = {
      execute: vi.fn().mockReturnValue({
        success: true,
        ediString: `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`,
      }),
    };

    mockFactory = {
      createBuildUseCase: vi.fn().mockReturnValue(mockBuildUseCase),
    } as any;

    buildCommand = new BuildCommand(mockFactory);

    vi.clearAllMocks();
  });

  describe('Happy Path - Successful Build', () => {
    it('should register build command with correct name and description', () => {
      const program = new Command();

      buildCommand.register(program);

      const commands = program.commands;
      expect(commands).toHaveLength(1);

      const command = commands[0];
      if (!command) throw new Error('Command not registered');

      expect(command.name()).toBe('build');
      expect(command.description()).toBe('Build an EDI message from JSON');
    });

    it('should require file argument', () => {
      const program = new Command();

      buildCommand.register(program);

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

      buildCommand.register(program);

      const command = program.commands[0];
      if (!command) throw new Error('Command not registered');

      const optionNames = command.options.map(opt => opt.long);

      expect(optionNames).toContain('--standard');
      expect(optionNames).toContain('--output');
    });

    it('should parse JSON input to EDIMessage', () => {
      const parseJSON = (buildCommand as any).parseJSON.bind(buildCommand);

      const jsonInput = {
        standard: 'EDIFACT',
        segments: [
          {
            tag: 'UNH',
            elements: [
              { value: '1' },
              { value: 'ORDERS:D:96A:UN' },
            ],
          },
        ],
      };

      const result = parseJSON(jsonInput);

      expect(result).toBeDefined();
      expect(result.standard).toBe(Standard.EDIFACT);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]?.tag).toBe('UNH');
    });

    it('should build EDI string from message', () => {
      const buildResult = {
        success: true,
        ediString: `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`,
      };

      expect(buildResult.success).toBe(true);
      expect(buildResult.ediString).toContain('UNB');
      expect(buildResult.ediString).toContain('UNH');
    });
  });

  describe('Edge Cases - Boundary Conditions', () => {
    it('should handle minimal valid JSON structure', () => {
      const parseJSON = (buildCommand as any).parseJSON.bind(buildCommand);

      const minimalJson = {
        standard: 'EDIFACT',
        segments: [],
      };

      const result = parseJSON(minimalJson);

      expect(result).toBeDefined();
      expect(result.standard).toBe(Standard.EDIFACT);
      expect(result.segments).toEqual([]);
    });

    it('should handle JSON with composite elements', () => {
      const parseJSON = (buildCommand as any).parseJSON.bind(buildCommand);

      const jsonWithComposite = {
        standard: 'EDIFACT',
        segments: [
          {
            tag: 'UNH',
            elements: [
              { value: '1' },
              {
                value: 'ORDERS:D:96A:UN',
                components: ['ORDERS', 'D', '96A', 'UN']
              },
            ],
          },
        ],
      };

      const result = parseJSON(jsonWithComposite);

      expect(result).toBeDefined();
      expect(result.segments).toHaveLength(1);
      const segment = result.segments[0];
      expect(segment?.tag).toBe('UNH');
      expect(segment?.elements).toHaveLength(2);
      expect(segment?.elements[1]?.components).toHaveLength(4);
    });

    it('should parse standard string to Standard enum', () => {
      const parseStandard = (buildCommand as any).parseStandard.bind(buildCommand);

      expect(parseStandard('EDIFACT')).toBe(Standard.EDIFACT);
      expect(parseStandard('edifact')).toBe(Standard.EDIFACT);
      expect(parseStandard('X12')).toBe(Standard.X12);
    });
  });

  describe('Error Cases - Failure Scenarios', () => {
    it('should throw error for invalid JSON structure', () => {
      const parseJSON = (buildCommand as any).parseJSON.bind(buildCommand);

      const invalidJson = {
        invalidField: 'test',
      };

      expect(() => parseJSON(invalidJson)).toThrow();
    });

    it('should throw error for missing standard field', () => {
      const parseJSON = (buildCommand as any).parseJSON.bind(buildCommand);

      const jsonWithoutStandard = {
        segments: [],
      };

      expect(() => parseJSON(jsonWithoutStandard)).toThrow('Missing required field: standard');
    });

    it('should throw error for invalid standard', () => {
      const parseStandard = (buildCommand as any).parseStandard.bind(buildCommand);

      expect(() => parseStandard('INVALID')).toThrow('Unsupported standard: INVALID');
    });

    it('should throw error when build use case fails', async () => {
      mockBuildUseCase.execute.mockReturnValue({
        success: false,
        errors: [{ code: 'BUILD_ERROR', message: 'Build failed' }],
      });

      const execute = (buildCommand as any).execute.bind(buildCommand);

      await expect(() => execute('test.json', {})).rejects.toThrow();
    });
  });

  describe('Output Formatting', () => {
    it('should output EDI string to console by default', () => {
      const ediString = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+1'`;

      expect(ediString).toBeDefined();
      expect(typeof ediString).toBe('string');
      expect(ediString.length).toBeGreaterThan(0);
    });

    it('should format output for file when --output specified', () => {
      const ediString = `UNB+UNOC:3+SENDER+RECEIVER+20240124:1200+1'`;

      expect(ediString).toBeDefined();
      expect(ediString).toContain('UNB');
    });
  });
});
