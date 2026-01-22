import { Standard } from '../value-objects/Standard';
import { Delimiters } from '../value-objects/Delimiters';

export class StandardDelimiters {
  private static readonly EDIFACT_DELIMITERS = Delimiters.custom({
    component: ':',
    element: '+',
    decimal: '.',
    escape: '?',
    segment: "'",
  });

  private static readonly X12_DELIMITERS = Delimiters.custom({
    component: '>',
    element: '*',
    decimal: '.',
    escape: '',
    segment: '~',
    repetition: '^',
  });

  private static readonly VDA_DELIMITERS = Delimiters.custom({
    component: '',
    element: ';',
    decimal: '.',
    escape: '',
    segment: '\n',
  });

  private static readonly configurations = new Map<Standard, Delimiters>([
    [Standard.EDIFACT, StandardDelimiters.EDIFACT_DELIMITERS],
    [Standard.X12, StandardDelimiters.X12_DELIMITERS],
    [Standard.VDA, StandardDelimiters.VDA_DELIMITERS],
  ]);

  static getDefault(standard: Standard): Delimiters {
    const delimiters = StandardDelimiters.configurations.get(standard);

    if (!delimiters) {
      throw new Error(`No default delimiters defined for standard: ${standard.toString()}`);
    }

    return delimiters;
  }

  static hasConfiguration(standard: Standard): boolean {
    return StandardDelimiters.configurations.has(standard);
  }

  static getAllStandards(): Standard[] {
    return Array.from(StandardDelimiters.configurations.keys());
  }
}
