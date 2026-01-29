import { describe, it, expect } from 'vitest';
import { ParserConfig, DEFAULT_PARSER_CONFIG } from '@application/configuration';

describe('ParserConfig', () => {
  describe('DEFAULT_PARSER_CONFIG', () => {
    it('should have code as default propertyParseMode', () => {
      expect(DEFAULT_PARSER_CONFIG.propertyParseMode).toBe('code');
    });

    it('should have code as default codeListValueParseMode', () => {
      expect(DEFAULT_PARSER_CONFIG.codeListValueParseMode).toBe('code');
    });
  });

  describe('ParserConfig interface', () => {
    it('should accept code mode for both options', () => {
      const config: ParserConfig = {
        propertyParseMode: 'code',
        codeListValueParseMode: 'code',
      };

      expect(config.propertyParseMode).toBe('code');
      expect(config.codeListValueParseMode).toBe('code');
    });

    it('should accept name mode for both options', () => {
      const config: ParserConfig = {
        propertyParseMode: 'name',
        codeListValueParseMode: 'name',
      };

      expect(config.propertyParseMode).toBe('name');
      expect(config.codeListValueParseMode).toBe('name');
    });

    it('should accept mixed modes', () => {
      const config: ParserConfig = {
        propertyParseMode: 'code',
        codeListValueParseMode: 'name',
      };

      expect(config.propertyParseMode).toBe('code');
      expect(config.codeListValueParseMode).toBe('name');
    });
  });
});
