import { Delimiters } from '../../../domain';

/**
 * Tokenizer Port (Interface)
 *
 * Contract for tokenizing EDI messages into segments.
 * Infrastructure layer implements this interface.
 */
export interface ITokenizer {
  /**
   * Tokenize EDI message into segments
   *
   * @param message - Raw EDI message without format-specific header
   * @param delimiters - Delimiter configuration
   * @returns Array of segment strings
   */
  tokenize(message: string, delimiters: Delimiters): string[];
}
