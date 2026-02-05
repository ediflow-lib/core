import { Delimiters, IDelimiterDetector } from '@ediflow/core';

/**
 * X12 Delimiter Detector
 *
 * Extracts delimiters from X12 ISA segment (positions 3, 82, 104, 105).
 * ISA segment is fixed-length (106 characters).
 *
 * @see Story #47
 */
export class X12DelimiterDetector implements IDelimiterDetector {
  private static readonly ISA_MIN_LENGTH = 106;
  private static readonly ELEMENT_SEPARATOR_POS = 3;
  private static readonly REPETITION_SEPARATOR_POS = 82;
  private static readonly COMPONENT_SEPARATOR_POS = 104;
  private static readonly SEGMENT_TERMINATOR_POS = 105;

  /**
   * Detect delimiters from X12 ISA segment
   *
   * X12 ISA format (fixed-length):
   * ISA*00*          *00*          *ZZ*SENDER...       *0*P*>~
   *    ^                                                    ^^
   *    Position 3: Element (*)
   *    Position 82: Repetition (^ or space)
   *    Position 104: Component (>)
   *    Position 105: Segment (~)
   *
   * @param message - X12 message starting with ISA
   * @returns Delimiters extracted from ISA
   * @throws Error if message doesn't start with ISA or is too short
   */
  detect(message: string): Delimiters {
    this.validateMessage(message);

    const element = message[X12DelimiterDetector.ELEMENT_SEPARATOR_POS] ?? '*';
    const component = message[X12DelimiterDetector.COMPONENT_SEPARATOR_POS] ?? '>';
    const segment = message[X12DelimiterDetector.SEGMENT_TERMINATOR_POS] ?? '~';
    const repetitionChar = message[X12DelimiterDetector.REPETITION_SEPARATOR_POS];
    const repetition = repetitionChar && repetitionChar !== ' ' ? repetitionChar : undefined;

    return Delimiters.custom({
      element,
      component,
      segment,
      decimal: '.',
      escape: '',
      repetition,
    });
  }

  /**
   * Get message without ISA delimiter header
   *
   * X12 doesn't have a separate delimiter header like EDIFACT UNA.
   * ISA is part of the message, so we return the full message.
   *
   * @param message - X12 message
   * @returns Full message (ISA included)
   */
  getMessageWithoutFormatSpecificHeader(message: string): string {
    return message;
  }

  private validateMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (!message.startsWith('ISA')) {
      throw new Error('X12 message must start with ISA segment');
    }

    if (message.length < X12DelimiterDetector.ISA_MIN_LENGTH) {
      throw new Error(`ISA segment must be at least ${X12DelimiterDetector.ISA_MIN_LENGTH} characters`);
    }
  }
}
