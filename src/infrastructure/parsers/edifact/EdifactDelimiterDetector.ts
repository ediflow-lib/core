import { Delimiters } from '../../../domain/value-objects/Delimiters';
import { Standard } from '../../../domain/value-objects/Standard';
import { StandardDelimiters } from '../../../domain/configuration/StandardDelimiters';
import { IDelimiterDetector } from '../../../application/ports/IDelimiterDetector';

/**
 * EdifactDelimiterDetector
 *
 * Detects and extracts delimiters from EDIFACT messages.
 * Handles UNA Service String segment or falls back to standard defaults.
 *
 * UNA Service String (optional):
 * - Position: First 9 characters of message
 * - Format: UNA:+.? '
 * - Purpose: Override default delimiters
 *
 * Standard EDIFACT Delimiters (ISO 9735):
 * - Component separator: :
 * - Element separator: +
 * - Decimal notation: .
 * - Escape character: ?
 * - Segment terminator: '
 *
 * Infrastructure Layer (Parser Adapter)
 */
export class EdifactDelimiterDetector implements IDelimiterDetector {
  private static readonly UNA_PREFIX = 'UNA';
  private static readonly UNA_LENGTH = 9;

  /**
   * Detect delimiters from EDIFACT message
   *
   * Priority:
   * 1. Extract from UNA segment (if present)
   * 2. Use standard EDIFACT defaults from DelimiterConfiguration
   *
   * @param message - Raw EDIFACT message string
   * @returns Delimiters configuration
   */
  detect(message: string): Delimiters {
    if (this.hasUNA(message)) {
      return this.extractFromUNA(message);
    }

    return StandardDelimiters.getDefault(Standard.EDIFACT);
  }

  /**
   * Get message content without UNA segment
   *
   * Implements IDelimiterDetector.getMessageWithoutFormatSpecificHeader()
   */
  getMessageWithoutFormatSpecificHeader(message: string): string {
    if (this.hasUNA(message)) {
      return message.substring(EdifactDelimiterDetector.UNA_LENGTH);
    }

    return message;
  }

  /**
   * Get message content without UNA segment
   * @deprecated Use getMessageWithoutFormatSpecificHeader() instead
   */
  getMessageWithoutUNA(message: string): string {
    return this.getMessageWithoutFormatSpecificHeader(message);
  }

  /**
   * Check if message has UNA segment
   *
   * UNA segment:
   * - Always starts with "UNA"
   * - Always exactly 9 characters total
   * - No segment terminator
   *
   * @param message - Raw EDIFACT message
   */
  hasUNA(message: string): boolean {
    return message.startsWith(EdifactDelimiterDetector.UNA_PREFIX) && message.length >= EdifactDelimiterDetector.UNA_LENGTH;
  }

  /**
   * Extract delimiters from UNA segment
   *
   * UNA Structure: UNA:+.? '
   *                   012345678
   *                   ^^^^^^
   *                   Positions 3-8
   *
   * Position 3 (index 3): Component separator    (:)
   * Position 4 (index 4): Element separator      (+)
   * Position 5 (index 5): Decimal notation       (.)
   * Position 6 (index 6): Escape character       (?)
   * Position 7 (index 7): Reserved               (space)
   * Position 8 (index 8): Segment terminator     (')
   *
   * @param message - Raw EDIFACT message starting with UNA
   */
  extractFromUNA(message: string): Delimiters {
    if (!this.hasUNA(message)) {
      throw new Error('Message does not start with valid UNA segment');
    }

    // Extract delimiter characters from UNA
    const component = message.charAt(3);
    const element = message.charAt(4);
    const decimal = message.charAt(5);
    const escape = message.charAt(6);
    // Position 7 is reserved (space)
    const segment = message.charAt(8);

    return Delimiters.custom({
      component,
      element,
      decimal,
      escape,
      segment,
    });
  }
}
