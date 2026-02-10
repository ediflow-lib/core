import { Delimiters, DelimitersConfig } from '@ediflow/core';

/**
 * EdifactDelimiters
 *
 * EDIFACT-specific delimiters with UNA segment generation.
 * Extends Core Delimiters with EDIFACT-specific functionality.
 */
export class EdifactDelimiters extends Delimiters {
  /**
   * Generates UNA (Service String Advice) segment for EDIFACT.
   * UNA is optional in EDIFACT but useful to explicitly define delimiters.
   *
   * Format: UNA:+.? '
   * - Position 1: Component separator (:)
   * - Position 2: Element separator (+)
   * - Position 3: Decimal separator (.)
   * - Position 4: Escape character (?)
   * - Position 5: Space (reserved)
   * - Position 6: Segment terminator (')
   *
   * @returns UNA segment string
   */
  toUNA(): string {
    return `UNA${this.component}${this.element}${this.decimal}${this.escape} ${this.segment}`;
  }

  /**
   * Creates EDIFACT default delimiters.
   * These are the most common delimiters used in EDIFACT messages.
   *
   * @returns EdifactDelimiters with default values
   */
  static default(): EdifactDelimiters {
    return new EdifactDelimiters({
      component: ':',
      element: '+',
      decimal: '.',
      escape: '?',
      segment: "'",
    });
  }

  /**
   * Creates EDIFACT delimiters with custom values.
   *
   * @param config - Delimiter configuration
   * @returns EdifactDelimiters instance
   */
  static override custom(config: DelimitersConfig): EdifactDelimiters {
    return new EdifactDelimiters(config);
  }
}
