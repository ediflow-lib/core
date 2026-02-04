/**
 * X12 Tokenizer
 *
 * Splits X12 EDI messages into tokens (segments, elements, components).
 *
 * @module X12Tokenizer
 * @see Story #45
 */

const ISA_MIN_LENGTH = 106;

/**
 * X12 Token representing a parsed segment
 */
export interface X12Token {
  /** Segment type classification */
  type: 'ISA' | 'GS' | 'ST' | 'SEGMENT' | 'SE' | 'GE' | 'IEA';
  /** Segment identifier (e.g., 'REF', 'DTM') */
  tag: string;
  /** Parsed elements with sub-elements (components) */
  elements: string[][];
}

/**
 * X12 Delimiter configuration extracted from ISA segment
 * @internal
 */
interface X12Delimiters {
  /** Element separator (typically '*') */
  element: string;
  /** Component separator (typically '>') */
  component: string;
  /** Segment terminator (typically '~') */
  segment: string;
  /** Repetition separator (optional, typically '^') */
  repetition?: string;
}

/**
 * X12 EDI Message Tokenizer
 *
 * Extracts delimiters from ISA segment and tokenizes X12 messages
 * into structured segments with parsed elements and components.
 *
 * @example
 * ```typescript
 * const tokenizer = new X12Tokenizer();
 * const tokens = tokenizer.tokenize(x12Message);
 * ```
 */
export class X12Tokenizer {
  /**
   * Tokenize an X12 message into structured tokens
   *
   * @param message - Raw X12 message starting with ISA segment
   * @returns Array of parsed X12 tokens
   * @throws Error if message is invalid or doesn't start with ISA
   */
  tokenize(message: string): X12Token[] {
    this.validateMessage(message);

    const delimiters = this.extractDelimiters(message);
    const segmentStrings = this.splitIntoSegments(message, delimiters.segment);

    return segmentStrings.map(segment => this.parseSegment(segment, delimiters));
  }

  private validateMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (!message.startsWith('ISA')) {
      throw new Error('X12 message must start with ISA');
    }

    if (message.length < ISA_MIN_LENGTH) {
      throw new Error(`ISA segment must be at least ${ISA_MIN_LENGTH} characters`);
    }
  }

  private extractDelimiters(message: string): X12Delimiters {
    const element = message[3] ?? '*';
    const component = message[104] ?? '>';
    const segment = message[105] ?? '~';
    const repetitionChar = message[82];
    const repetition = repetitionChar && repetitionChar !== ' ' ? repetitionChar : undefined;

    return { element, component, segment, repetition };
  }

  private splitIntoSegments(message: string, segmentDelimiter: string): string[] {
    return message
      .split(segmentDelimiter)
      .filter(segment => segment.trim().length > 0);
  }

  private parseSegment(segment: string, delimiters: X12Delimiters): X12Token {
    const tag = this.extractTag(segment, delimiters.element);
    const elements = this.parseElements(segment, delimiters);
    const type = this.determineSegmentType(tag);

    return { type, tag, elements };
  }

  private extractTag(segment: string, elementDelimiter: string): string {
    const firstDelimiterIndex = segment.indexOf(elementDelimiter);
    return firstDelimiterIndex === -1 ? segment : segment.substring(0, firstDelimiterIndex);
  }

  private parseElements(segment: string, delimiters: X12Delimiters): string[][] {
    const elementStrings = segment.split(delimiters.element);

    return elementStrings.map(element => {
      if (element.length === 0) {
        return [];
      }

      if (delimiters.repetition && element.includes(delimiters.repetition)) {
        return element.split(delimiters.repetition);
      }

      if (element.includes(delimiters.component)) {
        return element.split(delimiters.component);
      }

      return [element];
    });
  }

  private determineSegmentType(tag: string): X12Token['type'] {
    switch (tag) {
      case 'ISA': return 'ISA';
      case 'GS': return 'GS';
      case 'ST': return 'ST';
      case 'SE': return 'SE';
      case 'GE': return 'GE';
      case 'IEA': return 'IEA';
      default: return 'SEGMENT';
    }
  }
}
