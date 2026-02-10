import { EDISegment, Delimiters } from '@domain';

/**
 * Segment Parser Port (Interface)
 *
 * Contract for parsing EDI segment strings into EDISegment entities.
 * Infrastructure layer implements this interface for different EDI standards.
 *
 * @see EdifactSegmentParser - EDIFACT implementation
 * @see X12SegmentParser - X12 implementation
 */
export interface ISegmentParser {
  /**
   * Parse a segment string into EDISegment entity
   *
   * @param segmentString - Raw segment string (e.g., "UNH+1+ORDERS:D:96A" for EDIFACT, "REF*DP*12345" for X12)
   * @param delimiters - Delimiter configuration for parsing
   * @returns Parsed EDISegment with tag and elements
   *
   * @throws Error if segment string is invalid
   *
   * @example
   * ```typescript
   * // EDIFACT
   * const segment = parser.parseSegment("UNH+1+ORDERS:D:96A", edifactDelimiters);
   *
   * // X12
   * const segment = parser.parseSegment("REF*DP*12345", x12Delimiters);
   * ```
   */
  parseSegment(segmentString: string, delimiters: Delimiters): EDISegment;
}
