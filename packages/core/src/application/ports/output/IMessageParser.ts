import { EDIMessage, Standard } from '@domain';
import type { ParserConfig } from '@application/configuration';

/**
 * High-level parser interface for complete EDI messages.
 * Handles the complete parsing pipeline: delimiter detection, tokenization, and parsing.
 */
export interface IMessageParser {
  /**
   * Parses a complete EDI message string into an EDIMessage object.
   *
   * @param ediString - The complete EDI message string
   * @param config - Optional parser configuration for controlling parsing behavior
   * @returns Parsed EDIMessage with all segments and metadata
   * @throws Error if the message is invalid or cannot be parsed
   */
  parse(ediString: string, config?: ParserConfig): EDIMessage;

  /**
   * Returns the EDI standard this parser supports.
   */
  getSupportedStandard(): Standard;

  /**
   * Checks if this parser can parse the given EDI string.
   *
   * @param ediString - The EDI message string to check
   * @returns true if this parser can handle the message, false otherwise
   */
  canParse(ediString: string): boolean;

  /**
   * Returns the parser configuration used in the last parse operation.
   * Contains detected delimiters and other parsing metadata.
   */
  getConfiguration(): ParserConfig;
}
