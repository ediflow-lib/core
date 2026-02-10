import { EDIMessage, Standard, Delimiters } from '@domain';

/**
 * Port (Interface) for building EDI strings from EDIMessage objects.
 *
 * This interface is format-agnostic and works for:
 * - EDIFACT (UNA, segments with +, :, ')
 * - X12 (ISA, segments with *, ~, etc.)
 * - Future formats
 *
 * Implementation examples:
 * - EdifactMessageBuilder (packages/edifact)
 * - X12MessageBuilder (packages/x12)
 */
export interface IMessageBuilder {
  /**
   * Builds an EDI string from an EDI message.
   *
   * @param message - The EDI message to serialize
   * @param options - Optional builder options (delimiters, format, etc.)
   * @returns Built EDI string
   *
   * @example EDIFACT
   * ```typescript
   * const builder = new EdifactMessageBuilder();
   * const result = builder.build(message, {
   *   format: OutputFormat.COMPACT
   * });
   * // → "BGM+380+INV001'DTM+137:20250207:102'"
   * ```
   *
   * @example X12
   * ```typescript
   * const builder = new X12MessageBuilder();
   * const result = builder.build(message, {
   *   format: OutputFormat.COMPACT
   * });
   * // → "BGM*380*INV001~DTM*137*20250207*102~"
   * ```
   */
  build(message: EDIMessage, options?: MessageBuilderOptions): string;

  /**
   * Returns the EDI standard this builder supports.
   *
   * Used by the framework to route messages to the correct builder.
   *
   * @returns Standard.EDIFACT or Standard.X12
   */
  getSupportedStandard(): Standard;
}

/**
 * Generic builder options - format-agnostic!
 *
 * These options work for ALL formats (EDIFACT, X12, etc.).
 * Format-specific options should be defined in implementation-specific types
 * that extend this interface.
 *
 * @example EDIFACT-specific options
 * ```typescript
 * interface EdifactBuilderOptions extends MessageBuilderOptions {
 *   includeUNA?: boolean;  // EDIFACT-specific!
 * }
 * ```
 *
 * @example X12-specific options
 * ```typescript
 * interface X12BuilderOptions extends MessageBuilderOptions {
 *   includeISA?: boolean;  // X12-specific!
 * }
 * ```
 */
export interface MessageBuilderOptions {
  /**
   * Delimiters to use for building.
   *
   * If not provided, builder will use standard defaults for its format:
   * - EDIFACT: segment='  element='+' component=':' decimal='.' escape='?'
   * - X12: segment='~' element='*' component=':' decimal='.' escape=''
   *
   * Optional! Builder uses format-specific defaults if not provided.
   */
  delimiters?: Delimiters;

  /**
   * Output format for the EDI string.
   *
   * Controls how the EDI string is formatted:
   * - COMPACT: Single line, no whitespace (default)
   * - READABLE: With line breaks after each segment
   * - XML: EDI as XML structure (future)
   * - JSON: EDI as JSON structure (future)
   *
   * @default OutputFormat.COMPACT
   */
  format?: OutputFormat;
}

/**
 * Output format options for EDI string building.
 *
 * Format-agnostic - works for all EDI standards.
 */
export enum OutputFormat {
  /**
   * Compact format: Single line, no whitespace.
   *
   * EDIFACT: "UNH+1+INVOIC:D:96A:UN'BGM+380+INV001'UNT+3+1'"
   * X12: "ST*810*0001~BEG*00*SA*1234~SE*3*0001~"
   *
   * Use case: Production, file transfer, minimal size
   */
  COMPACT = 'compact',

  /**
   * Readable format: Line breaks after each segment, optional indentation.
   *
   * EDIFACT:
   * ```
   * UNH+1+INVOIC:D:96A:UN'
   * BGM+380+INV001'
   * UNT+3+1'
   * ```
   *
   * X12:
   * ```
   * ST*810*0001~
   * BEG*00*SA*1234~
   * SE*3*0001~
   * ```
   *
   * Use case: Debugging, logging, human review
   */
  READABLE = 'readable',

  /**
   * XML format: EDI message as XML structure.
   *
   * Future implementation - converts EDI to XML representation.
   *
   * Use case: Integration with XML-based systems
   */
  XML = 'xml',

  /**
   * JSON format: EDI message as JSON structure.
   *
   * Future implementation - converts EDI to JSON representation.
   *
   * Use case: APIs, JavaScript applications, modern integrations
   */
  JSON = 'json',
}
