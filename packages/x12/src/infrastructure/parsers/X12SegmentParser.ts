/**
 * X12 Segment Parser
 *
 * Parses X12 segment strings into EDISegment domain entities.
 * Implements ISegmentParser interface from core for Clean Architecture.
 *
 * @module X12SegmentParser
 * @see Story #47
 */

import { EDISegment, EDIElement, Delimiters, ISegmentParser } from '@ediflow/core';

/**
 * X12 Segment Parser
 *
 * Converts X12 segment strings into structured EDISegment objects.
 * Similar to EdifactSegmentParser but without escape character handling.
 *
 * X12 uses:
 * - Element separator: * (default)
 * - Component separator: > (default)
 * - Repetition separator: ^ (optional)
 * - Segment terminator: ~ (default)
 * - NO escape character (unlike EDIFACT's ?)
 */
export class X12SegmentParser implements ISegmentParser {
  /**
   * Parse an X12 segment string into EDISegment
   *
   * @param segmentString - X12 segment string (e.g., "REF*DP*12345~")
   * @param delimiters - Delimiter configuration
   * @returns Parsed EDISegment with tag and elements
   *
   * @example
   * ```typescript
   * const parser = new X12SegmentParser();
   * const segment = parser.parseSegment("REF*DP*12345~", delimiters);
   * // segment.tag === "REF"
   * // segment.elements.length === 2
   * ```
   */
  parseSegment(segmentString: string, delimiters: Delimiters): EDISegment {
    this.validateSegmentString(segmentString);

    const cleanedString = this.removeSegmentTerminator(segmentString, delimiters);
    const tag = this.extractTag(cleanedString, delimiters);
    const elements = this.parseElements(cleanedString, delimiters);

    return new EDISegment(tag, elements);
  }

  private validateSegmentString(segmentString: string): void {
    if (!segmentString || segmentString.trim().length === 0) {
      throw new Error('Segment string cannot be empty');
    }
  }

  private removeSegmentTerminator(segmentString: string, delimiters: Delimiters): string {
    if (segmentString.endsWith(delimiters.segment)) {
      return segmentString.slice(0, -1);
    }
    return segmentString;
  }

  private extractTag(segmentString: string, delimiters: Delimiters): string {
    const firstDelimiterPos = segmentString.indexOf(delimiters.element);

    if (firstDelimiterPos === -1) {
      return segmentString;
    }

    return segmentString.substring(0, firstDelimiterPos);
  }

  private parseElements(segmentString: string, delimiters: Delimiters): EDIElement[] {
    const firstDelimiterPos = segmentString.indexOf(delimiters.element);

    if (firstDelimiterPos === -1) {
      return [];
    }

    const elementsString = segmentString.substring(firstDelimiterPos + 1);

    if (elementsString.length === 0) {
      return [];
    }

    const elementStrings = elementsString.split(delimiters.element);

    return elementStrings.map(str => this.createEDIElement(str, delimiters));
  }

  private createEDIElement(elementString: string, delimiters: Delimiters): EDIElement {
    if (elementString.length === 0) {
      return new EDIElement('', []);
    }

    const hasRepetition = delimiters.repetition && elementString.includes(delimiters.repetition);
    const hasComponent = elementString.includes(delimiters.component);

    if (hasRepetition) {
      const components = elementString.split(delimiters.repetition!);
      return new EDIElement(elementString, components);
    }

    if (hasComponent) {
      const components = elementString.split(delimiters.component);
      return new EDIElement(elementString, components);
    }

    return new EDIElement(elementString, []);
  }
}
