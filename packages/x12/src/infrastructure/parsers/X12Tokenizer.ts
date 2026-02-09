/**
 * X12 Tokenizer
 *
 * Splits X12 EDI messages into segment strings.
 * Simple implementation for Story #49 - splits by segment terminator.
 *
 * @see Story #49
 */

import {Delimiters, ITokenizer} from '@ediflow/core';

export class X12Tokenizer implements ITokenizer {
  /**
   * Tokenize X12 message into segment strings
   *
   * @param message - Complete X12 message
   * @param delimiters - Delimiters to use for tokenization
   * @returns Array of segment strings
   */
  tokenize(message: string, delimiters: Delimiters): string[] {
    if (!message || message.trim().length === 0) {
      return [];
    }

    return message
        .split(delimiters.segment)
        .map(seg => seg.trim())
        .filter(seg => seg.length > 0);
  }
}
