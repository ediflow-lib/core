/**
 * MappingKeyTransformer
 *
 * Stateless utility that converts segment/element names or codes
 * to the target key format defined by MappingKeyStrategy.
 *
 * Used by StructureMappingService for both map() and unmap() directions.
 */

import type { MappingKeyStrategy } from './OutputKeyStrategy';
import type { SegmentNode, SegmentGroupNode, ElementNode, CompositeElementNode } from '@application/dtos';

export class MappingKeyTransformer {
  segmentKey(node: SegmentNode, strategy: MappingKeyStrategy): string {
    return strategy === 'code' ? node.tag : this.transform(node.name, strategy);
  }

  groupKey(node: SegmentGroupNode, strategy: MappingKeyStrategy): string {
    return strategy === 'code' ? node.id : this.transform(node.name, strategy);
  }

  elementKey(node: ElementNode | CompositeElementNode, strategy: MappingKeyStrategy): string {
    return strategy === 'code' ? node.code : this.transform(node.name, strategy);
  }

  transform(rawName: string, strategy: MappingKeyStrategy): string {
    switch (strategy) {
      case 'code':   return rawName;
      case 'name':   return rawName;
      case 'camelCase':   return this.toCamelCase(rawName);
      case 'snake_case':  return this.toSnakeCase(rawName);
      case 'kebab-case':  return this.toKebabCase(rawName);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private tokenise(name: string): string[] {
    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2')   // split camelCase
      .replace(/[^a-zA-Z0-9]+/g, ' ')         // non-alphanum → space
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(t => t.toLowerCase());
  }

  private toCamelCase(name: string): string {
    const tokens = this.tokenise(name);
    return tokens
      .map((t, i) => i === 0 ? t : t.charAt(0).toUpperCase() + t.slice(1))
      .join('');
  }

  private toSnakeCase(name: string): string {
    return this.tokenise(name).join('_');
  }

  private toKebabCase(name: string): string {
    return this.tokenise(name).join('-');
  }
}

export const mappingKeyTransformer = new MappingKeyTransformer();

