import { EDIMessage } from '@domain/entities/EDIMessage';
import type { EDISegment } from '@domain/value-objects/EDISegment';
import type { MessageStructureDTO, SegmentNode, SegmentGroupNode, SegmentOrGroup, ElementNode, SyntaxRuleDefinition } from '@application/dtos';
import { ValidationResult } from '@application/validation/ValidationResult';
import { ValidationError } from '@application/validation/ValidationError';
import { StructuralValidationContext } from './StructuralValidationContext';

type SegmentWindow = readonly EDISegment[];

/**
 * StructuralValidationService
 *
 * Application Service for validating EDI messages against their MessageStructure definition.
 *
 * Checks:
 * - Mandatory segments/groups
 * - Max occurrences
 * - Segment order
 * - Group hierarchy
 *
 * Clean Architecture:
 * - Application Service (NOT Domain!)
 * - Validates against external structure definitions (Infrastructure DTOs)
 * - Domain validation = EDIMessageValidator (validates entities only)
 */
export class StructuralValidationService {
  validate(ediMessage: EDIMessage, structure: MessageStructureDTO): ValidationResult {
    const errors: ValidationError[] = [];
    const context = new StructuralValidationContext();
    const window: SegmentWindow = ediMessage.segments;

    for (const node of structure.structure) {
      if (this.isSegmentNode(node)) {
        this.validateSegment(node, window, context, errors);
      } else if (this.isSegmentGroupNode(node)) {
        this.validateSegmentGroup(node, window, context, errors);
      }
    }

    if (errors.length > 0) {
      return ValidationResult.failure(...errors);
    }
    return ValidationResult.success();
  }

  private validateSegment(
    node: SegmentNode,
    window: SegmentWindow,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    const segments = window.filter(s => s.tag === node.tag);

    if (this.isMandatorySegmentMissing(node, segments)) {
      this.reportMissingSegment(node, context, errors);
      return;
    }

    if (this.segmentExceedsMaxOccurrences(segments, node.maxOccurrences)) {
      this.reportSegmentMaxOccurrencesExceeded(node, context, segments, errors);
    }

    if (node.elements.length > 0) {
      segments.forEach((segment, segmentIndex) => {
        this.validateSegmentElements(node, segment, segmentIndex, context, errors);
        this.validateSyntaxRules(node, segment, errors);
      });
    }
  }

  private validateSegmentGroup(
    node: SegmentGroupNode,
    window: SegmentWindow,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    const groupPath = this.buildGroupPath(context, node.id);
    const instanceSlices = this.sliceGroupInstances(window, node);

    if (this.isMandatoryGroupMissing(node, instanceSlices)) {
      this.reportMissingGroup(groupPath, node, errors);
      this.validateChildrenOfMissingGroup(node, window, context, errors);
      return;
    }

    if (this.exceedsMaxOccurrences(instanceSlices, node.maxOccurrences)) {
      this.reportMaxOccurrencesExceeded(groupPath, node, instanceSlices, errors);
      return;
    }

    for (const slice of instanceSlices) {
      this.validateGroupChildrenInWindow(node, slice, context, errors);
    }
  }

  /**
   * Slices the segment window into one sub-window per group instance.
   * Each instance starts at a trigger segment and ends just before the next trigger
   * at the same nesting level (or at the end of the window).
   */
  private sliceGroupInstances(window: SegmentWindow, node: SegmentGroupNode): SegmentWindow[] {
    const slices: SegmentWindow[] = [];
    const triggerIndices: number[] = [];

    for (let i = 0; i < window.length; i++) {
      if (window[i]!.tag === node.triggerSegment) {
        triggerIndices.push(i);
      }
    }

    for (let t = 0; t < triggerIndices.length; t++) {
      const start = triggerIndices[t]!;
      const end = t + 1 < triggerIndices.length ? triggerIndices[t + 1]! : window.length;
      slices.push(window.slice(start, end));
    }

    return slices;
  }

  private buildGroupPath(context: StructuralValidationContext, groupId: string): string {
    return context.path.length > 0 ? `${context.path.join('.')}.${groupId}` : groupId;
  }

  private isMandatoryGroupMissing(node: SegmentGroupNode, instanceSlices: SegmentWindow[]): boolean {
    return node.mandatory && instanceSlices.length === 0;
  }

  private reportMissingGroup(groupPath: string, node: SegmentGroupNode, errors: ValidationError[]): void {
    errors.push(new ValidationError(
      groupPath,
      `Mandatory segment group ${node.id} is missing`,
      'MISSING_MANDATORY_GROUP'
    ));
  }

  private validateChildrenOfMissingGroup(
    node: SegmentGroupNode,
    window: SegmentWindow,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    context.enterGroup(node.id);
    this.validateChildren(node.children, window, context, errors);
    context.exitGroup();
  }

  private exceedsMaxOccurrences(instanceSlices: SegmentWindow[], maxOccurrences: number): boolean {
    return instanceSlices.length > 0 && instanceSlices.length > maxOccurrences;
  }

  private reportMaxOccurrencesExceeded(
    groupPath: string,
    node: SegmentGroupNode,
    instanceSlices: SegmentWindow[],
    errors: ValidationError[]
  ): void {
    errors.push(new ValidationError(
      groupPath,
      `Segment group ${node.id} occurs ${instanceSlices.length} times (max: ${node.maxOccurrences})`,
      'MAX_GROUP_OCCURRENCES_EXCEEDED'
    ));
  }

  private validateGroupChildrenInWindow(
    node: SegmentGroupNode,
    window: SegmentWindow,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    context.enterGroup(node.id);
    this.validateChildren(node.children, window, context, errors);
    context.exitGroup();
  }

  private validateChildren(
    children: (SegmentNode | SegmentGroupNode)[],
    window: SegmentWindow,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    for (const child of children) {
      if (this.isSegmentNode(child)) {
        this.validateSegment(child, window, context, errors);
      } else if (this.isSegmentGroupNode(child)) {
        this.validateSegmentGroup(child, window, context, errors);
      }
    }
  }

  // ...existing code...

  private isMandatorySegmentMissing(node: SegmentNode, segments: EDISegment[]): boolean {
    return node.mandatory && segments.length === 0;
  }

  private reportMissingSegment(
    node: SegmentNode,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    const path = this.buildSegmentPath(context, node.tag);
    errors.push(new ValidationError(
      path,
      `Mandatory segment ${node.tag} is missing`,
      'MISSING_MANDATORY_SEGMENT'
    ));
  }

  private buildSegmentPath(context: StructuralValidationContext, tag: string): string {
    return context.path.length > 0 ? `${context.path.join('.')}.${tag}[0]` : `${tag}[0]`;
  }

  private segmentExceedsMaxOccurrences(segments: EDISegment[], maxOccurrences: number): boolean {
    return segments.length > 0 && segments.length > maxOccurrences;
  }

  private reportSegmentMaxOccurrencesExceeded(
    node: SegmentNode,
    context: StructuralValidationContext,
    segments: EDISegment[],
    errors: ValidationError[]
  ): void {
    const path = this.buildSegmentPath(context, node.tag);
    errors.push(new ValidationError(
      path,
      `Segment ${node.tag} occurs ${segments.length} times (max: ${node.maxOccurrences})`,
      'MAX_OCCURRENCES_EXCEEDED'
    ));
  }

  private validateSegmentElements(
    node: SegmentNode,
    segment: EDISegment,
    segmentIndex: number,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    for (const elementDef of node.elements) {
      if (elementDef.nodeType !== 'element') {
        continue;
      }
      const elementNode = elementDef as ElementNode;
      const elementValue = segment.elements[elementNode.position - 1]?.value ?? '';
      const fieldPath = this.buildElementPath(context, node.tag, segmentIndex, elementNode);

      if (elementNode.mandatory && elementValue === '') {
        errors.push(new ValidationError(fieldPath, `Mandatory element ${elementNode.code} is missing`, 'MISSING_MANDATORY_ELEMENT'));
        continue;
      }

      if (elementNode.maxLength !== undefined && elementValue.length > elementNode.maxLength) {
        errors.push(new ValidationError(fieldPath, `Element ${elementNode.code} exceeds max length ${elementNode.maxLength} (actual: ${elementValue.length})`, 'ELEMENT_TOO_LONG'));
      }
    }
  }

  private buildElementPath(
    context: StructuralValidationContext,
    tag: string,
    segmentIndex: number,
    element: ElementNode
  ): string {
    const segmentPath = context.path.length > 0 ? `${context.path.join('.')}.${tag}[${segmentIndex}]` : `${tag}[${segmentIndex}]`;
    return `${segmentPath}.${element.code}[${element.position}]`;
  }

  private validateSyntaxRules(
    node: SegmentNode,
    segment: EDISegment,
    errors: ValidationError[]
  ): void {
    if (!node.syntaxRules || node.syntaxRules.length === 0) {
      return;
    }

    for (const rule of node.syntaxRules) {
      const ruleErrors = this.applySyntaxRule(rule, node.tag, segment);
      errors.push(...ruleErrors);
    }
  }

  private applySyntaxRule(rule: SyntaxRuleDefinition, tag: string, segment: EDISegment): ValidationError[] {
    const present = rule.positions.map(pos => {
      const value = segment.elements[pos - 1]?.value ?? '';
      return value !== '';
    });

    switch (rule.type) {
      case 'P': return this.applyPRule(tag, present, rule.description);
      case 'R': return this.applyRRule(tag, present, rule.description);
      case 'E': return this.applyERule(tag, present, rule.description);
      case 'C': return this.applyCRule(tag, present, rule.description);
      case 'L': return this.applyLRule(tag, present, rule.description);
      default: return [];
    }
  }

  private applyPRule(tag: string, present: boolean[], description: string): ValidationError[] {
    const anyPresent = present.some(Boolean);
    const allPresent = present.every(Boolean);
    if (anyPresent && !allPresent) {
      return [new ValidationError(tag, description, 'SYNTAX_RULE_P_VIOLATION')];
    }
    return [];
  }

  private applyRRule(tag: string, present: boolean[], description: string): ValidationError[] {
    if (!present.some(Boolean)) {
      return [new ValidationError(tag, description, 'SYNTAX_RULE_R_VIOLATION')];
    }
    return [];
  }

  private applyERule(tag: string, present: boolean[], description: string): ValidationError[] {
    if (present.filter(Boolean).length > 1) {
      return [new ValidationError(tag, description, 'SYNTAX_RULE_E_VIOLATION')];
    }
    return [];
  }

  private applyCRule(tag: string, present: boolean[], description: string): ValidationError[] {
    const [first, ...rest] = present;
    if (first && rest.some(p => !p)) {
      return [new ValidationError(tag, description, 'SYNTAX_RULE_C_VIOLATION')];
    }
    return [];
  }

  private applyLRule(tag: string, present: boolean[], description: string): ValidationError[] {
    const [first, ...rest] = present;
    if (!first && rest.some(Boolean)) {
      return [new ValidationError(tag, description, 'SYNTAX_RULE_L_VIOLATION')];
    }
    return [];
  }

  private isSegmentNode(node: SegmentOrGroup): node is SegmentNode {
    return node.nodeType === 'segment';
  }

  private isSegmentGroupNode(node: SegmentOrGroup): node is SegmentGroupNode {
    return node.nodeType === 'segmentGroup';
  }
}
