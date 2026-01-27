import type { MessageStructure, SegmentOrGroup, SegmentNode, SegmentGroupNode, ElementNode } from '@domain/repositories/MessageStructure';
import type { JSONSchema, JSONSchemaType } from './JSONSchema';
import { SchemaCache } from './SchemaCache';

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

  /**
   * Generate JSON Schema from MessageStructure
   */
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
    } else if (node.nodeType === 'segmentGroup') {
      // If segment group has array mapping, create array property first
      if (node.mapping?.isArray) {
        const { targetField } = node.mapping;
        if (!properties[targetField]) {
          properties[targetField] = {
            type: 'array',
            items: this.generateSegmentGroupItemSchema(node),
            maxItems: node.maxOccurrences
          };
          if (node.mandatory && !required.includes(targetField)) {
            required.push(targetField);
          }
        }
      } else {
        // Non-array segment group: process children normally
        for (const child of node.children) {
          this.processNode(child, properties, required);
        }
      }
    }
  }

  private generateSegmentGroupItemSchema(group: SegmentGroupNode): JSONSchema {
    const itemProperties: Record<string, JSONSchema> = {};
    const itemRequired: string[] = [];

    for (const child of group.children) {
      if (child.nodeType === 'segment') {
        // For segments inside array group, use element names directly
        for (const element of child.elements) {
          if (element.nodeType === 'element') {
            this.processElement(element, element.name, itemProperties, element.mandatory ? itemRequired : []);
          }
        }
      }
    }

    return {
      type: 'object',
      properties: itemProperties,
      required: itemRequired.length > 0 ? itemRequired : undefined
    };
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
      // Only create array schema if it doesn't already exist (from segment group)
      if (!properties[targetField]) {
        properties[targetField] = {
          type: 'array',
          items: this.generateItemSchema(segment),
          maxItems: segment.maxOccurrences
        };
      }
    } else {
      for (const element of segment.elements) {
        if (element.nodeType === 'element') {
          this.processElement(element, targetField, properties, segment.mandatory ? required : []);
        }
      }
    }

    if (segment.mandatory && !required.includes(targetField)) {
      required.push(targetField);
    }
  }

  private generateItemSchema(segment: SegmentNode): JSONSchema {
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
    const schema: JSONSchema = {
      type: this.mapDataType(element.dataType),
      ...(element.maxLength && { maxLength: element.maxLength })
    };

    properties[fieldName] = schema;

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
