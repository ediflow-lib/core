import type {
  MessageStructureDTO,
  SegmentNode,
  SegmentGroupNode,
  SegmentOrGroup,
  ElementNode,
  CompositeElementNode,
  ElementOrComposite,
  SyntaxRuleDefinition
} from '@ediflow/core';
import type {
  MessageFile,
  MessageStructureNode,
  SegmentReference,
  SegmentGroupStructure,
  SegmentDefinition,
  ElementDefinition,
  CompositeDefinition,
  SegmentElement,
  SyntaxRule
} from './models/DataPackageModels';
/**
 * MessageStructureBuilder
 *
 * Assembles a complete MessageStructureDTO from Data Package JSON sources.
 *
 * Input: MessageFile (segmentRef, elementCode, compositeCode — references)
 * Output: MessageStructureDTO (SegmentNode, ElementNode, CompositeElementNode — resolved)
 *
 * Use DataPackageValidator before build() to catch missing definitions early.
 */
export class MessageStructureBuilder {
  constructor(
    private readonly segments: Record<string, SegmentDefinition>,
    private readonly elements: Record<string, ElementDefinition>,
    private readonly composites: Record<string, CompositeDefinition>,
    private readonly syntaxRules: Record<string, SyntaxRule[]> | null
  ) {}
  build(messageFile: MessageFile): MessageStructureDTO {
    return {
      standard: messageFile.standard,
      version: messageFile.version,
      messageType: messageFile.messageType,
      name: messageFile.name,
      description: messageFile.description,
      structure: this.resolveStructure(messageFile.structure)
    };
  }
  private resolveStructure(nodes: MessageStructureNode[]): SegmentOrGroup[] {
    return nodes.map(node => this.resolveNode(node));
  }
  private resolveNode(node: MessageStructureNode): SegmentOrGroup {
    if (node.nodeType === 'segment') {
      return this.resolveSegment(node);
    }
    return this.resolveSegmentGroup(node);
  }
  private resolveSegment(ref: SegmentReference): SegmentNode {
    const segmentDef = this.segments[ref.segmentRef];
    if (!segmentDef) {
      throw new Error(`Segment definition not found: ${ref.segmentRef}`);
    }
    const resolved: SegmentNode = {
      nodeType: 'segment',
      tag: segmentDef.tag,
      name: segmentDef.name,
      mandatory: ref.mandatory,
      maxOccurrences: ref.maxOccurrences,
      position: ref.position,
      elements: this.resolveElements(segmentDef.elements)
    };
    const rules = this.syntaxRules?.[ref.segmentRef];
    if (rules && rules.length > 0) {
      resolved.syntaxRules = rules.map(rule => this.toSyntaxRuleDefinition(rule));
    }
    return resolved;
  }
  private resolveSegmentGroup(group: SegmentGroupStructure): SegmentGroupNode {
    return {
      nodeType: 'segmentGroup',
      id: group.id,
      name: group.name,
      mandatory: group.mandatory,
      maxOccurrences: group.maxOccurrences,
      position: group.position,
      triggerSegment: group.triggerSegment,
      children: this.resolveStructure(group.structure)
    };
  }
  private resolveElements(elements: SegmentElement[]): ElementOrComposite[] {
    return elements.map(el => {
      if (el.nodeType === 'element') {
        return this.resolveElement(el.elementCode, el.mandatory, el.position);
      }
      return this.resolveComposite(el.compositeCode, el.mandatory, el.position);
    });
  }
  private resolveElement(code: string, mandatory: boolean, position: number): ElementNode {
    const elementDef = this.elements[code];
    if (!elementDef) {
      throw new Error(`Element definition not found: ${code}`);
    }
    const resolved: ElementNode = {
      nodeType: 'element',
      code: elementDef.code,
      name: elementDef.name,
      mandatory,
      position,
      dataType: elementDef.dataType,
      minLength: elementDef.minLength,
      maxLength: elementDef.maxLength
    };
    if (elementDef.codeListCode) {
      resolved.codeListCode = elementDef.codeListCode;
    }
    return resolved;
  }
  private resolveComposite(code: string, mandatory: boolean, position: number): CompositeElementNode {
    const compositeDef = this.composites[code];
    if (!compositeDef) {
      throw new Error(`Composite definition not found: ${code}`);
    }
    return {
      nodeType: 'composite',
      code: compositeDef.code,
      name: compositeDef.name,
      mandatory,
      position,
      components: compositeDef.components.map(comp =>
        this.resolveElement(comp.elementCode, comp.mandatory, comp.position)
      )
    };
  }
  private toSyntaxRuleDefinition(rule: SyntaxRule): SyntaxRuleDefinition {
    return {
      type: rule.type,
      positions: rule.positions,
      description: rule.description
    };
  }
}
