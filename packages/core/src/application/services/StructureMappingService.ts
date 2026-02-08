/**
 * StructureMappingService - Phase 2 Parsing/Building
 *
 * Application Service for mapping between generic EDIMessage and typed Business Objects.
 *
 * - map(): EDIMessage → Business Object (Phase 2 of Parsing)
 * - unmap(): Business Object → EDIMessage (Phase 1 of Building)
 *
 * Clean Architecture:
 * - Application Service (NOT Domain!)
 * - Orchestrates mapping between Domain Entities and Business Objects
 * - Uses Infrastructure DTOs (MessageStructureDTO)
 */

import { EDIMessage, EDISegment, EDIElement, Standard, Version, MessageType } from '@domain';
import { EDIMessageFactory } from '@application/factories';
import type { MessageStructureDTO, SegmentNode, SegmentGroupNode, SegmentOrGroup } from '@application/dtos';
import type { MappingRule } from './mapping/MappingRule';

export class StructureMappingService {
  /**
   * Maps generic EDIMessage to typed Business Object (Phase 2 of Parsing)
   *
   * @param ediMessage - Generic EDI message with segments
   * @param structure - Message structure with mapping rules
   * @returns Typed business object
   */
  map<T>(ediMessage: EDIMessage, structure: MessageStructureDTO): T {
    const result: any = {};

    for (const node of structure.structure) {
      this.mapNode(node, ediMessage, result);
    }

    return result as T;
  }

  /**
   * Maps Business Object to generic EDIMessage (Phase 1 of Building - reverse)
   *
   * @param businessObject - Typed business object
   * @param structure - Message structure with mapping rules
   * @returns Generic EDI message
   */
  unmap(businessObject: any, structure: MessageStructureDTO): EDIMessage {
    const standard = structure.standard as Standard;
    const version = new Version(standard, structure.version);
    const messageType = new MessageType(standard, structure.messageType);

    const ediMessage = EDIMessageFactory.create({ standard, version, messageType });

    // Process each node in the structure
    for (const node of structure.structure) {
      this.unmapNode(node, businessObject, ediMessage);
    }

    return ediMessage;
  }

  /**
   * Unmap a single node (segment or segment group) from business object
   */
  private unmapNode(
    node: SegmentOrGroup,
    businessObject: any,
    ediMessage: EDIMessage
  ): void {
    if (node.nodeType === 'segment') {
      this.unmapSegment(node, businessObject, ediMessage);
    } else if (node.nodeType === 'segmentGroup') {
      this.unmapSegmentGroup(node, businessObject, ediMessage);
    }
  }

  /**
   * Unmap a segment from business object field to EDI segment
   */
  private unmapSegment(
    node: SegmentNode,
    businessObject: any,
    ediMessage: EDIMessage
  ): void {
    if (!node.mapping) {
      return;
    }

    const fieldValue = businessObject[node.mapping.targetField];

    if (fieldValue === undefined || fieldValue === null) {
      return; // Skip optional fields
    }

    // Handle array mapping (multiple occurrences)
    if (node.mapping.isArray && Array.isArray(fieldValue)) {
      for (const item of fieldValue) {
        const segment = this.createSegment(node, item, node.mapping);
        ediMessage.addSegment(segment);
      }
    } else {
      // Single occurrence
      const segment = this.createSegment(node, fieldValue, node.mapping);
      ediMessage.addSegment(segment);
    }
  }

  /**
   * Unmap a segment group from nested business object to EDI segments
   */
  private unmapSegmentGroup(
    node: SegmentGroupNode,
    businessObject: any,
    ediMessage: EDIMessage
  ): void {
    if (!node.mapping) {
      return;
    }

    const fieldValue = businessObject[node.mapping.targetField];

    if (fieldValue === undefined || fieldValue === null) {
      return;
    }

    // Handle array of nested objects
    if (node.mapping.isArray && Array.isArray(fieldValue)) {
      for (const groupData of fieldValue) {
        this.unmapGroupOccurrence(node, groupData, ediMessage);
      }
    } else {
      // Single nested object
      this.unmapGroupOccurrence(node, fieldValue, ediMessage);
    }
  }

  /**
   * Unmap a single segment group occurrence
   */
  private unmapGroupOccurrence(
    node: SegmentGroupNode,
    groupData: any,
    ediMessage: EDIMessage
  ): void {
    // Process all child segments/groups in order
    for (const child of node.children) {
      if (child.nodeType === 'segment') {
        this.unmapSegment(child, groupData, ediMessage);
      } else {
        // Nested segment group
        this.unmapSegmentGroup(child, groupData, ediMessage);
      }
    }
  }

  /**
   * Create an EDI segment from business object field value
   */
  private createSegment(
    node: SegmentNode,
    fieldValue: any,
    mapping: MappingRule
  ): EDISegment {
    // Create elements array with proper size
    const elements: EDIElement[] = [];

    // Initialize with empty elements up to the mapping index
    for (let i = 0; i <= mapping.elementIndex; i++) {
      elements.push(new EDIElement('', []));
    }

    // Convert value back to string
    const stringValue = this.convertToString(fieldValue, mapping);

    // Handle composite elements
    if (mapping.componentIndex === undefined) {
      // Simple element
      elements[mapping.elementIndex] = new EDIElement(stringValue, []);
    } else {
      // Need to create a composite element
      const components: string[] = [];
      for (let i = 0; i <= mapping.componentIndex; i++) {
        components.push(i === mapping.componentIndex ? stringValue : '');
      }
      elements[mapping.elementIndex] = new EDIElement('', components);
    }

    return new EDISegment(node.tag, elements);
  }

  /**
   * Convert business object value to EDI string format
   */
  private convertToString(value: any, mapping: MappingRule): string {
    if (value === undefined || value === null) {
      return '';
    }

    switch (mapping.typeConversion) {
      case 'date':
        return this.formatDate(value, mapping.dateFormat);

      case 'number':
        return value.toString();

      case 'boolean':
        return value ? '1' : '0';

      case 'string':
      default:
        return value.toString();
    }
  }

  /**
   * Format Date object to EDI date string
   */
  private formatDate(date: Date, format?: string): string {
    if (isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (format === 'YYMMDD') {
      const shortYear = String(year).substring(2);
      return `${shortYear}${month}${day}`;
    } else {
      // YYYYMMDD or CCYYMMDD (default)
      return `${year}${month}${day}`;
    }
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
      result[node.mapping.targetField] = this.mapGroupOccurrence(
        node,
        ediMessage,
        triggerSegments[0]!
      );
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
    if (mapping.componentIndex === undefined) {
      // Simple element
      value = element.value;
    } else {
      // Extract component from composite element
      if (element.isComposite() && element.components[mapping.componentIndex]) {
        value = element.components[mapping.componentIndex]!;
      } else {
        return undefined;
      }
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
