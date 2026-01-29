/**
 * Parser configuration for controlling parsing behavior
 */
export interface ParserConfig {
  /**
   * How to identify properties in the input:
   * - 'code': Use property codes (e.g., "0001", "0002")
   * - 'name': Use property names in camelCase (e.g., "syntaxIdentifier", "syntaxVersion")
   */
  propertyParseMode: 'code' | 'name';

  /**
   * How to parse CodeList values:
   * - 'code': Parse CodeList values as codes (e.g., "UNOC", "3")
   * - 'name': Parse CodeList values as names (e.g., "UN/ECE level C", "Version 3")
   */
  codeListValueParseMode: 'code' | 'name';
}

/**
 * Default parser configuration
 */
export const DEFAULT_PARSER_CONFIG: ParserConfig = {
  propertyParseMode: 'code',
  codeListValueParseMode: 'code',
};
