import type {
  ElementNode,
  MessageStructure,
  SegmentGroupNode,
  SegmentNode,
  SegmentOrGroup
} from '@domain/repositories/MessageStructure';
import type {JSONSchema, JSONSchemaType} from './JSONSchema';
import {SchemaCache} from './SchemaCache';

/**
 * BusinessObjectSchemaGenerator
 *
 * Generates JSON Schema from MessageStructure at runtime.
 * Schemas are cached using SHA-256 hash of MessageStructure.
 *
 * Phase 3 Validation: BusinessObject → JSON Schema validation
 */
export class BusinessObjectSchemaGenerator {
  constructor(private readonly cache: SchemaCache) {}

  fromMessageStructure(structure: MessageStructure): JSONSchema {
    const cacheKey = SchemaCache.generateCacheKey(JSON.stringify(structure));
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const schema = this.generateSchema(structure);
    this.cache.set(cacheKey, schema);

    return schema;
  }

  private generateSchema(structure: MessageStructure): JSONSchema {
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];

    for (const node of structure.structure) {
      this.processNode(node, properties, required);
    }

    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: structure.name,
      description: structure.description,
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: false
    };
  }

  private processNode(
    node: SegmentOrGroup,
    properties: Record<string, JSONSchema>,
    required: string[]
  ): void {
    if (node.nodeType === 'segment') {
      this.processSegment(node, properties, required);
      return;
    }

    if (node.mapping?.isArray) {
      this.addArrayGroupProperty(node, properties, required);
    } else {
      this.processChildNodes(node, properties, required);
    }
  }

  private addArrayGroupProperty(
    group: SegmentGroupNode,
    properties: Record<string, JSONSchema>,
    required: string[]
  ): void {
    const { targetField } = group.mapping!;

    if (properties[targetField]) {
      return;
    }

    properties[targetField] = {
      type: 'array',
      items: this.createGroupItemSchema(group),
      maxItems: group.maxOccurrences
    };

    if (group.mandatory && !required.includes(targetField)) {
      required.push(targetField);
    }
  }

  private processChildNodes(
    group: SegmentGroupNode,
    properties: Record<string, JSONSchema>,
    required: string[]
  ): void {
    for (const child of group.children) {
      this.processNode(child, properties, required);
    }
  }

  private createGroupItemSchema(group: SegmentGroupNode): JSONSchema {
    const itemProperties: Record<string, JSONSchema> = {};
    const itemRequired: string[] = [];

    for (const child of group.children) {
      if (child.nodeType === 'segment') {
        this.addElementsToItemSchema(child, itemProperties, itemRequired);
      }
    }

    return {
      type: 'object',
      properties: itemProperties,
      required: itemRequired.length > 0 ? itemRequired : undefined
    };
  }

  private addElementsToItemSchema(
    segment: SegmentNode,
    properties: Record<string, JSONSchema>,
    required: string[]
  ): void {
    for (const element of segment.elements) {
      if (element.nodeType === 'element') {
        this.processElement(element, element.name, properties, element.mandatory ? required : []);
      }
    }
  }

  private processSegment(
    segment: SegmentNode,
    properties: Record<string, JSONSchema>,
    required: string[]
  ): void {
    if (!segment.mapping) {
      return;
    }

    const { targetField, isArray } = segment.mapping;

    if (isArray) {
      this.addArraySegmentProperty(segment, targetField, properties);
    } else {
      this.addSegmentElements(segment, targetField, properties, required);
    }

    if (segment.mandatory && !required.includes(targetField)) {
      required.push(targetField);
    }
  }

  private addArraySegmentProperty(
    segment: SegmentNode,
    targetField: string,
    properties: Record<string, JSONSchema>
  ): void {
    if (properties[targetField]) {
      return;
    }

    properties[targetField] = {
      type: 'array',
      items: this.createSegmentItemSchema(segment),
      maxItems: segment.maxOccurrences
    };
  }

  private addSegmentElements(
    segment: SegmentNode,
    targetField: string,
    properties: Record<string, JSONSchema>,
    required: string[]
  ): void {
    for (const element of segment.elements) {
      if (element.nodeType === 'element') {
        this.processElement(element, targetField, properties, segment.mandatory ? required : []);
      }
    }
  }

  private createSegmentItemSchema(segment: SegmentNode): JSONSchema {
    const itemProperties: Record<string, JSONSchema> = {};
    const itemRequired: string[] = [];

    for (const element of segment.elements) {
      if (element.nodeType === 'element') {
        this.processElement(element, element.name, itemProperties, element.mandatory ? itemRequired : []);
      }
    }

    return {
      type: 'object',
      properties: itemProperties,
      required: itemRequired.length > 0 ? itemRequired : undefined
    };
  }

  private processElement(
    element: ElementNode,
    fieldName: string,
    properties: Record<string, JSONSchema>,
    required: string[]
  ): void {
    properties[fieldName] = {
      type: this.mapDataType(element.dataType),
      ...(element.maxLength && {maxLength: element.maxLength})
    };

    if (element.mandatory) {
      required.push(fieldName);
    }
  }

  private mapDataType(dataType?: string): JSONSchemaType {
    switch (dataType) {
      case 'n':
        return 'number';
      case 'an':
      case 'a':
        return 'string';
      case 'date':
        return 'string'; // ISO date string
      default:
        return 'string';
    }
  }
}
