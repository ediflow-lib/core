import { Delimiters } from '../../../domain/value-objects/Delimiters';

/**
 * EdifactTokenizer
 *
 * Tokenizes EDIFACT messages into segments.
 * Handles escape characters and custom delimiters.
 *
 * Infrastructure Layer (Parser Component)
 */
export class EdifactTokenizer {
  private readonly delimiters: Delimiters;

  constructor(delimiters: Delimiters) {
    this.delimiters = delimiters;
  }

  /**
   * Tokenize EDIFACT message into segments
   *
   * Splits by segment terminator, respecting escape characters.
   * Escaped delimiters are not treated as delimiters.
   *
   * Escape rules:
   * - ?+ = escaped element separator (literal +)
   * - ?' = escaped segment terminator (literal ')
   * - ?? = escaped escape character (literal ?)
   *
   * @param message - Raw EDIFACT message (without UNA if present)
   * @returns Array of segment strings
   */
  tokenize(message: string): string[] {
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    const segments: string[] = [];
    let currentSegment = '';
    let i = 0;

    while (i < message.length) {
      const char = message[i];

      // Check for escape character
      if (char === this.delimiters.escape && i + 1 < message.length) {
        const nextChar = message[i + 1];

        // Escaped delimiter or escape character - add both to segment
        currentSegment += char + nextChar;
        i += 2;
        continue;
      }

      // Check for segment terminator
      if (char === this.delimiters.segment) {
        if (currentSegment.trim().length > 0) {
          segments.push(currentSegment);
        }
        currentSegment = '';
        i++;
        continue;
      }

      // Regular character
      currentSegment += char;
      i++;
    }

    // Add last segment if exists
    if (currentSegment.trim().length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  }
}
