/**
 * StructureMapper - Phase 2 Parsing/Building
 *
 * Maps between generic EDIMessage and typed Business Objects.
 *
 * - map(): EDIMessage → Business Object (Phase 2 of Parsing)
 * - unmap(): Business Object → EDIMessage (Phase 1 of Building)
 */

import type { EDIMessage } from '../entities/EDIMessage';
import type { EDISegment } from '../entities/EDISegment';
import type { MessageStructure, SegmentNode, SegmentGroupNode, SegmentOrGroup } from '../repositories/MessageStructure';
import type { MappingRule } from './MappingRule';

export class StructureMapper {
  /**
   * Maps generic EDIMessage to typed Business Object (Phase 2 of Parsing)
   *
   * @param ediMessage - Generic EDI message with segments
   * @param structure - Message structure with mapping rules
   * @returns Typed business object
   */
  map<T>(ediMessage: EDIMessage, structure: MessageStructure): T {
    const result: any = {};

    for (const node of structure.structure) {
      this.mapNode(node, ediMessage, result);
    }

    return result as T;
  }

  /**
   * Maps Business Object to generic EDIMessage (Phase 1 of Building - reverse)
   *
   * @param _businessObject - Typed business object
   * @param _structure - Message structure with mapping rules
   * @returns Generic EDI message
   */
  unmap(_businessObject: any, _structure: MessageStructure): EDIMessage {
    // TODO: Implement reverse mapping (Phase 1 of Building)
    throw new Error('unmap() not yet implemented');
  }

  /**
   * Map a single node (segment or segment group) to business object
   */
  private mapNode(
    node: SegmentOrGroup,
    ediMessage: EDIMessage,
    result: any
  ): void {
    if (node.nodeType === 'segment') {
      this.mapSegment(node, ediMessage, result);
    } else if (node.nodeType === 'segmentGroup') {
      this.mapSegmentGroup(node, ediMessage, result);
    }
  }

  /**
   * Map a segment to business object field
   */
  private mapSegment(
    node: SegmentNode,
    ediMessage: EDIMessage,
    result: any
  ): void {
    // Skip if no mapping rule defined
    if (!node.mapping) {
      return;
    }

    const segments = ediMessage.segments.filter((s: EDISegment) => s.tag === node.tag);

    // Handle array mapping (multiple occurrences)
    if (node.mapping.isArray) {
      result[node.mapping.targetField] = segments.map((seg: EDISegment) =>
        this.extractValue(seg, node.mapping!)
      );
    } else {
      // Single occurrence
      const segment = segments[0];
      if (segment) {
        result[node.mapping.targetField] = this.extractValue(segment, node.mapping);
      }
    }
  }

  /**
   * Map a segment group to nested business object
   */
  private mapSegmentGroup(
    node: SegmentGroupNode,
    ediMessage: EDIMessage,
    result: any
  ): void {
    if (!node.mapping) {
      // No mapping for this group - just process children
      for (const child of node.children) {
        this.mapNode(child, ediMessage, result);
      }
      return;
    }

    // Find trigger segment occurrences
    const triggerSegments = ediMessage.segments.filter(
      (s: EDISegment) => s.tag === node.triggerSegment
    );

    if (triggerSegments.length === 0) {
      return; // No groups found
    }

    if (node.mapping.isArray) {
      // Map to array of nested objects
      result[node.mapping.targetField] = triggerSegments.map((triggerSeg: EDISegment) =>
        this.mapGroupOccurrence(node, ediMessage, triggerSeg)
      );
    } else {
      // Map to single nested object (first occurrence)
      const groupObject = this.mapGroupOccurrence(
        node,
        ediMessage,
        triggerSegments[0]!
      );
      result[node.mapping.targetField] = groupObject;
    }
  }

  /**
   * Map a single segment group occurrence to nested object
   */
  private mapGroupOccurrence(
    node: SegmentGroupNode,
    ediMessage: EDIMessage,
    triggerSegment: EDISegment
  ): any {
    const groupObject: any = {};

    // Find the position of the trigger segment
    const triggerIndex = ediMessage.segments.indexOf(triggerSegment);

    // Map all child segments/groups that belong to this group instance
    for (const child of node.children) {
      if (child.nodeType === 'segment') {
        this.mapGroupSegment(child, ediMessage, triggerIndex, groupObject);
      } else {
        // Nested segment group - recursive
        this.mapSegmentGroup(child, ediMessage, groupObject);
      }
    }

    return groupObject;
  }

  /**
   * Map a segment within a group context
   */
  private mapGroupSegment(
    node: SegmentNode,
    ediMessage: EDIMessage,
    groupStartIndex: number,
    groupObject: any
  ): void {
    if (!node.mapping) {
      return;
    }

    // Find segments after the trigger segment
    const segments = ediMessage.segments
      .slice(groupStartIndex)
      .filter((s: EDISegment) => s.tag === node.tag);

    if (segments.length === 0) {
      return;
    }

    // For simplicity, take the first matching segment within the group
    const segment = segments[0];
    if (segment) {
      groupObject[node.mapping.targetField] = this.extractValue(
        segment,
        node.mapping
      );
    }
  }

  /**
   * Extract value from segment element and apply type conversion
   */
  private extractValue(segment: EDISegment, mapping: MappingRule): any {
    const element = segment.elements[mapping.elementIndex];

    if (!element) {
      return undefined;
    }

    let value: string;

    // Handle composite elements (componentIndex)
    if (mapping.componentIndex !== undefined) {
      // Extract component from composite element
      if (element.isComposite() && element.components[mapping.componentIndex]) {
        value = element.components[mapping.componentIndex]!;
      } else {
        return undefined;
      }
    } else {
      // Simple element
      value = element.value;
    }

    // Apply type conversion
    return this.convertType(value, mapping);
  }

  /**
   * Convert value to target type
   */
  private convertType(value: string, mapping: MappingRule): any {
    // Allow empty strings for string type, but return undefined for other types
    if (value === undefined || value === null) {
      return undefined;
    }

    // For non-string types, treat empty string as undefined
    if (value === '' && mapping.typeConversion && mapping.typeConversion !== 'string') {
      return undefined;
    }

    switch (mapping.typeConversion) {
      case 'date':
        return this.parseDate(value, mapping.dateFormat);

      case 'number':
        return Number(value);

      case 'boolean':
        return value === '1' || value.toLowerCase() === 'true';

      case 'string':
      default:
        return value;
    }
  }

  /**
   * Parse date string based on format
   */
  private parseDate(value: string, format?: string): Date {
    if (!format || format === 'YYYYMMDD') {
      // YYYYMMDD: 20260126
      const year = value.substring(0, 4);
      const month = value.substring(4, 6);
      const day = value.substring(6, 8);
      return new Date(`${year}-${month}-${day}`);
    } else if (format === 'YYMMDD') {
      // YYMMDD: 260126 → 2026-01-26
      const year = '20' + value.substring(0, 2);
      const month = value.substring(2, 4);
      const day = value.substring(4, 6);
      return new Date(`${year}-${month}-${day}`);
    } else if (format === 'CCYYMMDD') {
      // CCYYMMDD: Same as YYYYMMDD
      return this.parseDate(value, 'YYYYMMDD');
    }

    // Fallback: Try to parse as-is
    return new Date(value);
  }
}
