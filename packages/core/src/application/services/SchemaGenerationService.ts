import type {
  CompositeElementNode,
  ElementNode,
  MessageStructureDTO,
  SegmentGroupNode,
  SegmentNode,
  SegmentOrGroup
} from '@application/dtos';
import type {JSONSchema, JSONSchemaType} from './JSONSchema';
import {SchemaCache} from './SchemaCache';

/**
 * SchemaGenerationService
 *
 * Generates JSON Schema from a fully-resolved MessageStructureDTO.
 * Uses segment tag + element codes directly — no mapping rules required.
 *
 * Output schema structure:
 *   - Top-level properties = segment tags / group ids, sorted by position ascending
 *   - Segment groups become nested object/array properties keyed by group id (SG2, SG25, …)
 *   - Elements become properties keyed by element code (1004, C002, …), sorted by position
 *   - x-position, x-mandatory, x-maxOccurrences, x-nodeType, x-triggerSegment extensions
 *     are included on every property for full structure transparency
 */
export class SchemaGenerationService {
  constructor(private readonly cache: SchemaCache) {}

  fromMessageStructure(structure: MessageStructureDTO): JSONSchema {
    const cacheKey = SchemaCache.generateCacheKey(JSON.stringify(structure));
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const schema = this.generateSchema(structure);
    this.cache.set(cacheKey, schema);
    return schema;
  }

  private generateSchema(structure: MessageStructureDTO): JSONSchema {
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
      properties: this.sortPropertiesByPosition(properties),
      required: required.length > 0 ? required : undefined,
      additionalProperties: false
    };
  }

  // ── Sorting ────────────────────────────────────────────────────────────────

  private sortPropertiesByPosition(properties: Record<string, JSONSchema>): Record<string, JSONSchema> {
    const entries = Object.entries(properties);
    entries.sort(([, a], [, b]) => {
      const posA = a['x-position'] ?? a.items?.['x-position'] ?? 0;
      const posB = b['x-position'] ?? b.items?.['x-position'] ?? 0;
      return posA - posB;
    });
    return Object.fromEntries(entries);
  }

  private processNode(
    node: SegmentOrGroup,
    properties: Record<string, JSONSchema>,
    required: string[]
  ): void {
    if (node.nodeType === 'segment') {
      this.processSegment(node, properties, required);
    } else {
      this.processSegmentGroup(node, properties, required);
    }
  }

  // ── Segment → property keyed by tag ──────────────────────────────────────

  private processSegment(
    segment: SegmentNode,
    properties: Record<string, JSONSchema>,
    required: string[]
  ): void {
    const key = segment.tag;
    const extensions = {
      'x-position': segment.position,
      'x-mandatory': segment.mandatory,
      'x-maxOccurrences': segment.maxOccurrences,
      'x-nodeType': 'segment' as const
    };

    if (segment.maxOccurrences && segment.maxOccurrences > 1) {
      if (!properties[key]) {
        properties[key] = {
          type: 'array',
          title: segment.name,
          items: { ...this.buildSegmentObjectSchema(segment), ...extensions },
          maxItems: segment.maxOccurrences,
          ...extensions
        };
      }
    } else {
      if (!properties[key]) {
        properties[key] = {
          ...this.buildSegmentObjectSchema(segment),
          title: segment.name,
          ...extensions
        };
      }
    }

    if (segment.mandatory && !required.includes(key)) {
      required.push(key);
    }
  }

  private buildSegmentObjectSchema(segment: SegmentNode): JSONSchema {
    const elementProperties: Record<string, JSONSchema> = {};
    const elementRequired: string[] = [];

    for (const element of segment.elements) {
      if (element.nodeType === 'element') {
        elementProperties[element.code] = this.buildElementSchema(element);
        if (element.mandatory) elementRequired.push(element.code);
      } else if (element.nodeType === 'composite') {
        elementProperties[element.code] = this.buildCompositeSchema(element);
        if (element.mandatory) elementRequired.push(element.code);
      }
    }

    return {
      type: 'object',
      properties: this.sortPropertiesByPosition(elementProperties),
      required: elementRequired.length > 0 ? elementRequired : undefined
    };
  }

  private buildElementSchema(element: ElementNode): JSONSchema {
    return {
      type: this.mapDataType(element.dataType),
      title: element.name,
      ...(element.maxLength !== undefined ? { maxLength: element.maxLength } : {}),
      ...(element.minLength !== undefined ? { minLength: element.minLength } : {}),
      'x-position': element.position,
      'x-mandatory': element.mandatory,
      'x-nodeType': 'element' as const
    };
  }

  private buildCompositeSchema(composite: CompositeElementNode): JSONSchema {
    const componentProperties: Record<string, JSONSchema> = {};
    const componentRequired: string[] = [];

    for (const component of composite.components) {
      componentProperties[component.code] = this.buildElementSchema(component);
      if (component.mandatory) componentRequired.push(component.code);
    }

    return {
      type: 'object',
      title: composite.name,
      properties: this.sortPropertiesByPosition(componentProperties),
      required: componentRequired.length > 0 ? componentRequired : undefined,
      'x-position': composite.position,
      'x-mandatory': composite.mandatory,
      'x-nodeType': 'composite' as const
    };
  }

  // ── Segment Group → nested property keyed by group id ────────────────────

  private processSegmentGroup(
    group: SegmentGroupNode,
    properties: Record<string, JSONSchema>,
    required: string[]
  ): void {
    const key = group.id;
    const extensions = {
      'x-position': group.position,
      'x-mandatory': group.mandatory,
      'x-maxOccurrences': group.maxOccurrences,
      'x-triggerSegment': group.triggerSegment,
      'x-nodeType': 'segmentGroup' as const
    };

    const itemSchema = this.buildGroupItemSchema(group);

    if (group.maxOccurrences && group.maxOccurrences > 1) {
      properties[key] = {
        type: 'array',
        title: group.name,
        items: { ...itemSchema, ...extensions },
        maxItems: group.maxOccurrences,
        ...extensions
      };
    } else {
      properties[key] = {
        ...itemSchema,
        title: group.name,
        ...extensions
      };
    }

    if (group.mandatory && !required.includes(key)) {
      required.push(key);
    }
  }

  private buildGroupItemSchema(group: SegmentGroupNode): JSONSchema {
    const childProperties: Record<string, JSONSchema> = {};
    const childRequired: string[] = [];

    for (const child of group.children) {
      this.processNode(child, childProperties, childRequired);
    }

    return {
      type: 'object',
      properties: this.sortPropertiesByPosition(childProperties),
      required: childRequired.length > 0 ? childRequired : undefined
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private mapDataType(dataType?: string): JSONSchemaType {
    switch (dataType) {
      case 'n':  return 'number';
      case 'an':
      case 'a':  return 'string';
      case 'date': return 'string';
      default:   return 'string';
    }
  }
}
