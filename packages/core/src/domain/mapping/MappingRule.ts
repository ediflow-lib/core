/**
 * Mapping Rule Interface for Structure Mapping (Phase 2 Parsing)
 *
 * Defines how to map EDI segments/elements to Business Object fields.
 * Used by StructureMapper to convert EDIMessage → Typed Business Object.
 */

export interface MappingRule {
  /**
   * Target field name in Business Object
   * @example 'documentNumber', 'parties', 'lineItems'
   */
  targetField: string;

  /**
   * Which element in the segment (0-based index)
   * @example 0 = first element, 1 = second element
   */
  elementIndex: number;

  /**
   * For composite elements: which component (0-based index)
   * @example For S009 composite: 0 = message type, 1 = version
   */
  componentIndex?: number;

  /**
   * Type conversion to apply when mapping
   * @default 'string'
   */
  typeConversion?: 'date' | 'number' | 'boolean' | 'string';

  /**
   * Date format for parsing (used when typeConversion = 'date')
   * @example 'YYYYMMDD', 'YYMMDD', 'CCYYMMDD'
   */
  dateFormat?: string;

  /**
   * If true, multiple occurrences map to array field
   * @default false
   */
  isArray?: boolean;

  /**
   * Nested mapping rules for complex structures
   * Used for mapping segment groups to nested objects
   */
  nestedMapping?: MappingRule[];
}
