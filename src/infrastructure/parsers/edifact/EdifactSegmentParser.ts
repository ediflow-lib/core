import { EDISegment, EDIElement, Delimiters } from '@domain';

/**
 * Parser for EDIFACT segment strings.
 * Converts segment strings into EDISegment objects with EDIElement objects.
 */
export class EdifactSegmentParser {
  /**
   * Parses an EDIFACT segment string into an EDISegment object.
   *
   * @param segmentString - The segment string to parse (e.g., "UNH+1+ORDERS:D:96A:UN'")
   * @param delimiters - The delimiters to use for parsing
   * @returns Parsed EDISegment with tag and elements
   *
   * @example
   * const parser = new EdifactSegmentParser();
   * const delimiters = new Delimiters('+', ':', "'", '?');
   * const segment = parser.parseSegment("UNH+1+ORDERS:D:96A:UN'", delimiters);
   * // segment.tag === "UNH"
   * // segment.elements.length === 2
   */
  parseSegment(segmentString: string, delimiters: Delimiters): EDISegment {
    this.validateSegmentString(segmentString);

    // Remove segment terminator if present
    const cleanedString = this.removeSegmentTerminator(segmentString, delimiters);

    // Extract segment tag
    const tag = this.extractTag(cleanedString, delimiters);

    // Parse elements
    const elements = this.parseElements(cleanedString, delimiters);

    return new EDISegment(tag, elements);
  }

  /**
   * Validates that the segment string is not empty.
   */
  private validateSegmentString(segmentString: string): void {
    if (!segmentString || segmentString.trim().length === 0) {
      throw new Error('Segment string cannot be empty');
    }
  }

  /**
   * Removes the segment terminator from the end of the string if present.
   */
  private removeSegmentTerminator(segmentString: string, delimiters: Delimiters): string {
    if (segmentString.endsWith(delimiters.segment)) {
      return segmentString.slice(0, -1);
    }
    return segmentString;
  }

  /**
   * Extracts the segment tag (the part before the first element delimiter).
   *
   * @example
   * extractTag("UNH+1+ORDERS", delimiters) // returns "UNH"
   * extractTag("UNT", delimiters) // returns "UNT"
   */
  private extractTag(segmentString: string, delimiters: Delimiters): string {
    const firstDelimiterPos = segmentString.indexOf(delimiters.element);

    if (firstDelimiterPos === -1) {
      // No delimiter found, entire string is the tag
      return segmentString;
    }

    return segmentString.substring(0, firstDelimiterPos);
  }

  /**
   * Parses all elements from the segment string.
   *
   * @example
   * parseElements("UNH+1+ORDERS:D:96A", delimiters)
   * // returns [EDIElement("1"), EDIElement("ORDERS:D:96A")]
   */
  private parseElements(segmentString: string, delimiters: Delimiters): EDIElement[] {
    const firstDelimiterPos = segmentString.indexOf(delimiters.element);

    if (firstDelimiterPos === -1) {
      // No elements, only tag
      return [];
    }

    // Get the part after the tag
    const elementsString = segmentString.substring(firstDelimiterPos + 1);

    if (elementsString.length === 0) {
      return [];
    }

    // Split by element delimiter, respecting escape characters
    const elementStrings = this.splitRespectingEscape(
      elementsString,
      delimiters.element,
      delimiters.escape
    );

    // Convert each element string to an EDIElement
    return elementStrings.map(str => new EDIElement(str));
  }

  /**
   * Splits a string by a delimiter, respecting escape characters.
   *
   * @example
   * splitRespectingEscape("A+B+C", "+", "?") // ["A", "B", "C"]
   * splitRespectingEscape("A?+B+C", "+", "?") // ["A+B", "C"]
   * splitRespectingEscape("A++C", "+", "?") // ["A", "", "C"]
   */
  private splitRespectingEscape(
    input: string,
    delimiter: string,
    escape: string
  ): string[] {
    const result: string[] = [];
    let current = '';
    let i = 0;

    while (i < input.length) {
      const char = input[i];
      const nextChar = input[i + 1];

      // Check for escape character
      if (char === escape && nextChar !== undefined) {
        // Add the escaped character literally (skip the escape char itself)
        current += nextChar;
        i += 2; // Skip both escape and next character
        continue;
      }

      // Check for delimiter
      if (char === delimiter) {
        result.push(current);
        current = '';
        i++;
        continue;
      }

      // Regular character
      current += char;
      i++;
    }

    // Don't forget the last element
    result.push(current);

    return result;
  }
}
