import { Standard } from '../value-objects/Standard';
import { Delimiters } from '../value-objects/Delimiters';

/**
 * StandardDelimiters
 *
 * Domain knowledge about standard delimiter specifications.
 * Contains business rules from EDI standards (ISO 9735, ANSI ASC X12, etc.)
 *
 * Domain Layer (Business Knowledge/Configuration)
 */
export class StandardDelimiters {
  private static readonly configurations: Map<Standard, Delimiters> = new Map([
    // EDIFACT standard delimiters (ISO 9735)
    // UNA Service String default: UNA:+.? '
    [
      Standard.EDIFACT,
      Delimiters.custom({
        component: ':',
        element: '+',
        decimal: '.',
        escape: '?',
        segment: "'",
      }),
    ],

    // X12 standard delimiters (ANSI ASC X12)
    // ISA Interchange Control Header defines delimiters
    [
      Standard.X12,
      Delimiters.custom({
        component: '>',
        element: '*',
        decimal: '.',
        escape: '',
        segment: '~',
        repetition: '^',
      }),
    ],

    // VDA standard delimiters
    [
      Standard.VDA,
      Delimiters.custom({
        component: '',
        element: ';',
        decimal: '.',
        escape: '',
        segment: '\n',
      }),
    ],
  ]);

  /**
   * Get default delimiters for a standard
   *
   * @param standard - EDI standard
   * @returns Default delimiters configuration
   * @throws Error if standard is not supported
   */
  static getDefault(standard: Standard): Delimiters {
    const delimiters = StandardDelimiters.configurations.get(standard);

    if (!delimiters) {
      throw new Error(`No default delimiters defined for standard: ${standard.toString()}`);
    }

    return delimiters;
  }

  /**
   * Check if standard has default configuration
   *
   * @param standard - EDI standard
   */
  static hasConfiguration(standard: Standard): boolean {
    return StandardDelimiters.configurations.has(standard);
  }

  /**
   * Get all supported standards with delimiter configurations
   */
  static getSupportedStandards(): Standard[] {
    return Array.from(StandardDelimiters.configurations.keys());
  }
}
