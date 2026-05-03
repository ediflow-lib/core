/**
 * StructureMappingService - Phase 2 Parsing/Building
 *
 * - map(): EDIMessage → Business Object
 * - unmap(): Business Object → EDIMessage
 *
 * Strategy parameter controls how keys are named (default: 'code').
 * Same strategy must be used for both directions.
 */
import { EDIMessage, EDISegment, EDIElement, Standard, Version, MessageType } from '@domain';
import { EDIMessageFactory } from '@application/factories';
import type { MessageStructureDTO, SegmentNode, SegmentGroupNode, SegmentOrGroup, CompositeElementNode } from '@application/dtos';
import type { MappingRule } from './mapping/MappingRule';
import { type MappingKeyStrategy, DEFAULT_MAPPING_KEY_STRATEGY } from './mapping/OutputKeyStrategy';
import { mappingKeyTransformer } from './mapping/MappingKeyTransformer';
export class StructureMappingService {
  map<T>(ediMessage: EDIMessage, structure: MessageStructureDTO, strategy: MappingKeyStrategy = DEFAULT_MAPPING_KEY_STRATEGY): T {
    const result: Record<string, unknown> = {};
    for (const node of structure.structure) this.mapNode(node, ediMessage, result, strategy);
    return result as T;
  }
  unmap(businessObject: unknown, structure: MessageStructureDTO, strategy: MappingKeyStrategy = DEFAULT_MAPPING_KEY_STRATEGY): EDIMessage {
    const ediMessage = EDIMessageFactory.create({
      standard: structure.standard as Standard,
      version: new Version(structure.standard as Standard, structure.version),
      messageType: new MessageType(structure.standard as Standard, structure.messageType),
    });
    for (const node of structure.structure) this.unmapNode(node, businessObject, ediMessage, strategy);
    return ediMessage;
  }
  // ── map() ──────────────────────────────────────────────────────────────────
  private mapNode(node: SegmentOrGroup, ediMessage: EDIMessage, result: Record<string, unknown>, strategy: MappingKeyStrategy): void {
    if (node.nodeType === 'segment') this.mapSegment(node, ediMessage, result, strategy);
    else this.mapSegmentGroup(node, ediMessage, result, strategy);
  }
  private mapSegment(node: SegmentNode, ediMessage: EDIMessage, result: Record<string, unknown>, strategy: MappingKeyStrategy): void {
    if (!node.mapping) { this.mapStructureBasedSegment(node, ediMessage.segments as EDISegment[], result, strategy); return; }
    const segs = (ediMessage.segments as EDISegment[]).filter(s => s.tag === node.tag);
    if (node.mapping.isArray) result[node.mapping.targetField] = segs.map(s => this.extractValue(s, node.mapping!));
    else { const s = segs[0]; if (s) result[node.mapping.targetField] = this.extractValue(s, node.mapping); }
  }
  private mapSegmentGroup(node: SegmentGroupNode, ediMessage: EDIMessage, result: Record<string, unknown>, strategy: MappingKeyStrategy): void {
    if (!node.mapping) {
      result[mappingKeyTransformer.groupKey(node, strategy)] = this.mapStructureBasedGroup(node, ediMessage.segments as EDISegment[], strategy);
      return;
    }
    const triggers = (ediMessage.segments as EDISegment[]).filter(s => s.tag === node.triggerSegment);
    if (triggers.length === 0) return;
    if (node.mapping.isArray) result[node.mapping.targetField] = triggers.map(t => this.mapGroupOccurrence(node, ediMessage, t, strategy));
    else result[node.mapping.targetField] = this.mapGroupOccurrence(node, ediMessage, triggers[0]!, strategy);
  }
  private mapGroupOccurrence(node: SegmentGroupNode, ediMessage: EDIMessage, triggerSeg: EDISegment, strategy: MappingKeyStrategy): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    const idx = (ediMessage.segments as EDISegment[]).indexOf(triggerSeg);
    for (const child of node.children) {
      if (child.nodeType === 'segment') {
        if (!child.mapping) { this.mapStructureBasedSegment(child, (ediMessage.segments as EDISegment[]).slice(idx), obj, strategy); }
        else {
          const segs = (ediMessage.segments as EDISegment[]).slice(idx).filter(s => s.tag === child.tag);
          const s = segs[0];
          if (s) obj[child.mapping.targetField] = this.extractValue(s, child.mapping);
        }
      } else {
        this.mapSegmentGroup(child, ediMessage, obj, strategy);
      }
    }
    return obj;
  }
  // ── unmap() ────────────────────────────────────────────────────────────────
  private unmapNode(node: SegmentOrGroup, src: unknown, ediMessage: EDIMessage, strategy: MappingKeyStrategy): void {
    if (node.nodeType === 'segment') this.unmapSegment(node, src, ediMessage, strategy);
    else this.unmapSegmentGroup(node, src, ediMessage, strategy);
  }
  private unmapSegment(node: SegmentNode, src: unknown, ediMessage: EDIMessage, strategy: MappingKeyStrategy): void {
    if (!node.mapping) { this.unmapStructureBasedSegment(node, src, ediMessage, strategy); return; }
    const obj = src as Record<string, unknown>;
    const val = obj[node.mapping.targetField];
    if (val === undefined || val === null) return;
    if (node.mapping.isArray && Array.isArray(val)) for (const item of val) ediMessage.addSegment(this.createSegment(node, item, node.mapping));
    else ediMessage.addSegment(this.createSegment(node, val, node.mapping));
  }
  private unmapSegmentGroup(node: SegmentGroupNode, src: unknown, ediMessage: EDIMessage, strategy: MappingKeyStrategy): void {
    if (!node.mapping) { this.unmapStructureBasedGroup(node, src, ediMessage, strategy); return; }
    const obj = src as Record<string, unknown>;
    const val = obj[node.mapping.targetField];
    if (val === undefined || val === null) return;
    if (node.mapping.isArray && Array.isArray(val)) for (const item of val) this.unmapGroupOccurrence(node, item, ediMessage, strategy);
    else this.unmapGroupOccurrence(node, val, ediMessage, strategy);
  }
  private unmapGroupOccurrence(node: SegmentGroupNode, groupData: unknown, ediMessage: EDIMessage, strategy: MappingKeyStrategy): void {
    for (const child of node.children) {
      if (child.nodeType === 'segment') this.unmapSegment(child, groupData, ediMessage, strategy);
      else this.unmapSegmentGroup(child, groupData, ediMessage, strategy);
    }
  }
  // ── Structure-based map() ──────────────────────────────────────────────────
  private mapStructureBasedSegment(node: SegmentNode, allSegs: EDISegment[], result: Record<string, unknown>, strategy: MappingKeyStrategy): void {
    const matching = allSegs.filter(s => s.tag === node.tag);
    if (matching.length === 0) return;
    const mapOne = (seg: EDISegment): Record<string, unknown> => {
      const obj: Record<string, unknown> = {};
      for (const elemNode of node.elements) {
        const ediElem = seg.elements[elemNode.position - 1];
        if (!ediElem) continue;
        const key = mappingKeyTransformer.elementKey(elemNode, strategy);
        if (elemNode.nodeType === 'element') {
          obj[key] = ediElem.value;
        } else {
          const comp = elemNode as CompositeElementNode;
          const nested: Record<string, unknown> = {};
          for (const c of comp.components) {
            nested[mappingKeyTransformer.elementKey(c, strategy)] = ediElem.isComposite()
              ? (ediElem.components[c.position - 1] ?? '')
              : (c.position === 1 ? ediElem.value : '');
          }
          obj[key] = nested;
        }
      }
      return obj;
    };
    const segKey = mappingKeyTransformer.segmentKey(node, strategy);
    result[segKey] = matching.length > 1 ? matching.map(mapOne) : mapOne(matching[0]!);
  }
  private mapStructureBasedGroup(node: SegmentGroupNode, allSegs: EDISegment[], strategy: MappingKeyStrategy): Record<string, unknown>[] {
    return this.sliceGroupInstances(node.triggerSegment, allSegs).map(slice => {
      const obj: Record<string, unknown> = {};
      const synth = this.buildSyntheticMessage(slice);
      for (const child of node.children) this.mapNode(child, synth, obj, strategy);
      return obj;
    });
  }
  private sliceGroupInstances(triggerTag: string, segments: EDISegment[]): EDISegment[][] {
    const instances: EDISegment[][] = [];
    let current: EDISegment[] | null = null;
    for (const seg of segments) {
      if (seg.tag === triggerTag) { if (current !== null) instances.push(current); current = [seg]; }
      else if (current !== null) current.push(seg);
    }
    if (current !== null && current.length > 0) instances.push(current);
    return instances;
  }
  private buildSyntheticMessage(segments: EDISegment[]): EDIMessage {
    const msg = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });
    for (const s of segments) msg.addSegment(s);
    return msg;
  }
  // ── Structure-based unmap() ────────────────────────────────────────────────
  private unmapStructureBasedSegment(node: SegmentNode, src: unknown, ediMessage: EDIMessage, strategy: MappingKeyStrategy): void {
    const obj = src as Record<string, unknown>;
    const val = obj[mappingKeyTransformer.segmentKey(node, strategy)];
    if (val === undefined || val === null) return;
    const items = Array.isArray(val) ? val : [val];
    for (const item of items) {
      const maxPos = node.elements.reduce((m, e) => Math.max(m, e.position), 0);
      const elements: EDIElement[] = Array.from({ length: maxPos }, () => new EDIElement('', []));
      for (const elemNode of node.elements) {
        const idx = elemNode.position - 1;
        const elemKey = mappingKeyTransformer.elementKey(elemNode, strategy);
        const elemVal = (item as Record<string, unknown>)[elemKey];
        if (elemNode.nodeType === 'element') {
          elements[idx] = new EDIElement(elemVal !== undefined ? String(elemVal) : '', []);
        } else {
          const comp = elemNode as CompositeElementNode;
          const nested = (elemVal ?? {}) as Record<string, unknown>;
          const maxCompPos = comp.components.reduce((m, c) => Math.max(m, c.position), 0);
          const components: string[] = Array.from({ length: maxCompPos }, () => '');
          for (const c of comp.components) {
            const ck = mappingKeyTransformer.elementKey(c, strategy);
            components[c.position - 1] = nested[ck] !== undefined ? String(nested[ck]) : '';
          }
          elements[idx] = new EDIElement('', components);
        }
      }
      ediMessage.addSegment(new EDISegment(node.tag, elements));
    }
  }
  private unmapStructureBasedGroup(node: SegmentGroupNode, src: unknown, ediMessage: EDIMessage, strategy: MappingKeyStrategy): void {
    const obj = src as Record<string, unknown>;
    const val = obj[mappingKeyTransformer.groupKey(node, strategy)];
    if (!Array.isArray(val)) return;
    for (const item of val) for (const child of node.children) this.unmapNode(child, item, ediMessage, strategy);
  }
  // ── Legacy mapping-rule helpers (backward compat) ─────────────────────────
  private createSegment(node: SegmentNode, fieldValue: unknown, mapping: MappingRule): EDISegment {
    const elements: EDIElement[] = [];
    for (let i = 0; i <= mapping.elementIndex; i++) elements.push(new EDIElement('', []));
    const str = this.convertToString(fieldValue, mapping);
    if (mapping.componentIndex === undefined) {
      elements[mapping.elementIndex] = new EDIElement(str, []);
    } else {
      const components: string[] = [];
      for (let i = 0; i <= mapping.componentIndex; i++) components.push(i === mapping.componentIndex ? str : '');
      elements[mapping.elementIndex] = new EDIElement('', components);
    }
    return new EDISegment(node.tag, elements);
  }
  private extractValue(segment: EDISegment, mapping: MappingRule): unknown {
    const el = segment.elements[mapping.elementIndex];
    if (!el) return undefined;
    if (mapping.componentIndex === undefined) return this.convertType(el.value, mapping);
    if (el.isComposite() && el.components[mapping.componentIndex]) return this.convertType(el.components[mapping.componentIndex]!, mapping);
    return undefined;
  }
  private convertType(value: string, mapping: MappingRule): unknown {
    if (value === undefined || value === null) return undefined;
    if (value === '' && mapping.typeConversion && mapping.typeConversion !== 'string') return undefined;
    switch (mapping.typeConversion) {
      case 'date':    return this.parseDate(value, mapping.dateFormat);
      case 'number':  return Number(value);
      case 'boolean': return value === '1' || value.toLowerCase() === 'true';
      default:        return value;
    }
  }
  private convertToString(value: unknown, mapping: MappingRule): string {
    if (value === undefined || value === null) return '';
    switch (mapping.typeConversion) {
      case 'date':    return this.formatDate(value as Date, mapping.dateFormat);
      case 'number':  return String(value);
      case 'boolean': return (value as boolean) ? '1' : '0';
      default:        return String(value);
    }
  }
  private formatDate(date: Date, format?: string): string {
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
    return format === 'YYMMDD' ? `${String(y).substring(2)}${m}${d}` : `${y}${m}${d}`;
  }
  private parseDate(value: string, format?: string): Date {
    if (!format || format === 'YYYYMMDD' || format === 'CCYYMMDD')
      return new Date(`${value.substring(0, 4)}-${value.substring(4, 6)}-${value.substring(6, 8)}`);
    if (format === 'YYMMDD')
      return new Date(`20${value.substring(0, 2)}-${value.substring(2, 4)}-${value.substring(4, 6)}`);
    return new Date(value);
  }
}
