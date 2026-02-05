import { Delimiters, Standard, IDelimiterDetector } from '@ediflow/core';

export class EdifactDelimiterDetector implements IDelimiterDetector {
  private static readonly UNA_PREFIX = 'UNA';
  private static readonly UNA_LENGTH = 9;
  private static readonly UNA_COMPONENT_POSITION = 3;
  private static readonly UNA_ELEMENT_POSITION = 4;
  private static readonly UNA_DECIMAL_POSITION = 5;
  private static readonly UNA_ESCAPE_POSITION = 6;
  private static readonly UNA_SEGMENT_POSITION = 8;

  /**
   * EDIFACT Default Delimiters (UN/EDIFACT Standard)
   * Used when UNA segment is not present in the message
   */
  private static readonly DEFAULT_DELIMITERS = Delimiters.custom({
    component: ':',
    element: '+',
    decimal: '.',
    escape: '?',
    segment: "'",
  });

  detect(message: string): Delimiters {
    if (this.hasUNA(message)) {
      return this.extractFromUNA(message);
    }
    return EdifactDelimiterDetector.DEFAULT_DELIMITERS;
  }

  getMessageWithoutFormatSpecificHeader(message: string): string {
    if (this.hasUNA(message)) {
      return message.substring(EdifactDelimiterDetector.UNA_LENGTH);
    }
    return message;
  }

  getMessageWithoutUNA(message: string): string {
    return this.getMessageWithoutFormatSpecificHeader(message);
  }

  getSupportedStandard(): Standard {
    return Standard.EDIFACT;
  }

  hasUNA(message: string): boolean {
    return message.startsWith(EdifactDelimiterDetector.UNA_PREFIX) &&
           message.length >= EdifactDelimiterDetector.UNA_LENGTH;
  }

  public extractFromUNA(message: string): Delimiters {
    if (!this.hasUNA(message)) {
      throw new Error('Message does not have UNA segment');
    }

    return Delimiters.custom({
      component: message.charAt(EdifactDelimiterDetector.UNA_COMPONENT_POSITION),
      element: message.charAt(EdifactDelimiterDetector.UNA_ELEMENT_POSITION),
      decimal: message.charAt(EdifactDelimiterDetector.UNA_DECIMAL_POSITION),
      escape: message.charAt(EdifactDelimiterDetector.UNA_ESCAPE_POSITION),
      segment: message.charAt(EdifactDelimiterDetector.UNA_SEGMENT_POSITION),
    });
  }
}
