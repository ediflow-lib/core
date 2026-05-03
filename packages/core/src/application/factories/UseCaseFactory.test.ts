import { describe, it, expect, vi } from 'vitest';
import { UseCaseFactory } from '@application';
import { ParseEDIUseCase } from '@application/use-cases/parse/ParseEDIUseCase';
import { BuildEDIUseCase } from '@application/use-cases/build/BuildEDIUseCase';
import { ValidateMessageUseCase } from '@application/use-cases/validate/ValidateMessageUseCase';
import type { IMessageParser, IMessageBuilder, IValidationService } from '@application/ports';
import { Standard } from '@domain';
import type { EDIMessage } from '@domain';

const mockParser = (): IMessageParser => ({
  parse: vi.fn(),
  getSupportedStandard: vi.fn().mockReturnValue(Standard.EDIFACT),
  canParse: vi.fn().mockReturnValue(true),
  getConfiguration: vi.fn().mockReturnValue({}),
});

const mockBuilder = (): IMessageBuilder => ({
  build: vi.fn(),
  getSupportedStandard: vi.fn().mockReturnValue(Standard.EDIFACT),
});

const mockValidationService = (): IValidationService<EDIMessage> => ({
  validate: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
});

const createFactory = () => {
  const parsers = new Map<string, IMessageParser>([
    ['EDIFACT', mockParser()],
    ['X12', mockParser()],
  ]);
  const builders = new Map<string, IMessageBuilder>([
    ['EDIFACT', mockBuilder()],
  ]);
  return new UseCaseFactory(parsers, builders, mockValidationService());
};

describe('UseCaseFactory', () => {
  describe('createParseUseCase', () => {
    it('returns ParseEDIUseCase for a registered standard', () => {
      const factory = createFactory();
      const useCase = factory.createParseUseCase('EDIFACT');
      expect(useCase).toBeInstanceOf(ParseEDIUseCase);
    });

    it('is case-insensitive for standard name', () => {
      const factory = createFactory();
      expect(factory.createParseUseCase('edifact')).toBeInstanceOf(ParseEDIUseCase);
    });

    it('throws for unknown standard', () => {
      const factory = createFactory();
      expect(() => factory.createParseUseCase('UNKNOWN')).toThrow('No parser registered for standard: UNKNOWN');
    });

    it('passes mapper to ParseEDIUseCase when provided', () => {
      const factory = createFactory();
      const mapper = {} as any;
      const useCase = factory.createParseUseCase('EDIFACT', mapper);
      expect(useCase).toBeInstanceOf(ParseEDIUseCase);
    });
  });

  describe('createBuildUseCase', () => {
    it('returns BuildEDIUseCase for a registered standard', () => {
      const factory = createFactory();
      const useCase = factory.createBuildUseCase('EDIFACT');
      expect(useCase).toBeInstanceOf(BuildEDIUseCase);
    });

    it('throws for unknown standard', () => {
      const factory = createFactory();
      expect(() => factory.createBuildUseCase('X12')).toThrow('No builder registered for standard: X12');
    });
  });

  describe('createValidateUseCase', () => {
    it('returns ValidateMessageUseCase', () => {
      const factory = createFactory();
      expect(factory.createValidateUseCase()).toBeInstanceOf(ValidateMessageUseCase);
    });
  });

  describe('getSupportedStandards', () => {
    it('returns all registered parser keys', () => {
      const factory = createFactory();
      const standards = factory.getSupportedStandards();
      expect(standards).toContain('EDIFACT');
      expect(standards).toContain('X12');
      expect(standards).toHaveLength(2);
    });
  });
});

