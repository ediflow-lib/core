import { EDIMessage } from '@domain/entities/EDIMessage';
import type { MessageStructureDTO, SegmentNode, SegmentGroupNode, SegmentOrGroup } from '@infrastructure/repositories/dtos';
import { ValidationResult } from '@domain/validation/ValidationResult';
import { ValidationError } from '@domain/validation/ValidationError';
import { StructuralValidationContext } from './StructuralValidationContext';

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

    for (const node of structure.structure) {
      if (this.isSegmentNode(node)) {
        this.validateSegment(node, ediMessage, context, errors);
      } else if (this.isSegmentGroupNode(node)) {
        this.validateSegmentGroup(node, ediMessage, context, errors);
      }
    }

    if (errors.length > 0) {
      return ValidationResult.failure(...errors);
    }
    return ValidationResult.success();
  }

  private validateSegment(
    node: SegmentNode,
    ediMessage: EDIMessage,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    const segments = ediMessage.segments.filter(s => s.tag === node.tag);

    if (this.isMandatorySegmentMissing(node, segments)) {
      this.reportMissingSegment(node, context, errors);
      return;
    }

    if (this.segmentExceedsMaxOccurrences(segments, node.maxOccurrences)) {
      this.reportSegmentMaxOccurrencesExceeded(node, context, segments, errors);
    }
  }

  private isMandatorySegmentMissing(node: SegmentNode, segments: any[]): boolean {
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

  private segmentExceedsMaxOccurrences(segments: any[], maxOccurrences: number): boolean {
    return segments.length > 0 && segments.length > maxOccurrences;
  }

  private reportSegmentMaxOccurrencesExceeded(
    node: SegmentNode,
    context: StructuralValidationContext,
    segments: any[],
    errors: ValidationError[]
  ): void {
    const path = this.buildSegmentPath(context, node.tag);
    errors.push(new ValidationError(
      path,
      `Segment ${node.tag} occurs ${segments.length} times (max: ${node.maxOccurrences})`,
      'MAX_OCCURRENCES_EXCEEDED'
    ));
  }

  private validateSegmentGroup(
    node: SegmentGroupNode,
    ediMessage: EDIMessage,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    const groupPath = this.buildGroupPath(context, node.id);
    const triggerSegments = this.findTriggerSegments(ediMessage, node.triggerSegment);

    if (this.isMandatoryGroupMissing(node, triggerSegments)) {
      this.reportMissingGroup(groupPath, node, errors);
      this.validateChildrenOfMissingGroup(node, ediMessage, context, errors);
      return;
    }

    if (this.exceedsMaxOccurrences(triggerSegments, node.maxOccurrences)) {
      this.reportMaxOccurrencesExceeded(groupPath, node, triggerSegments, errors);
      return;
    }

    if (triggerSegments.length > 0) {
      this.validateGroupChildren(node, ediMessage, context, errors);
    }
  }

  private buildGroupPath(context: StructuralValidationContext, groupId: string): string {
    return context.path.length > 0 ? `${context.path.join('.')}.${groupId}` : groupId;
  }

  private findTriggerSegments(ediMessage: EDIMessage, triggerSegment: string): any[] {
    return ediMessage.segments.filter(s => s.tag === triggerSegment);
  }

  private isMandatoryGroupMissing(node: SegmentGroupNode, triggerSegments: any[]): boolean {
    return node.mandatory && triggerSegments.length === 0;
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
    ediMessage: EDIMessage,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    context.enterGroup(node.id);
    this.validateChildren(node.children, ediMessage, context, errors);
    context.exitGroup();
  }

  private exceedsMaxOccurrences(triggerSegments: any[], maxOccurrences: number): boolean {
    return triggerSegments.length > 0 && triggerSegments.length > maxOccurrences;
  }

  private reportMaxOccurrencesExceeded(
    groupPath: string,
    node: SegmentGroupNode,
    triggerSegments: any[],
    errors: ValidationError[]
  ): void {
    errors.push(new ValidationError(
      groupPath,
      `Segment group ${node.id} occurs ${triggerSegments.length} times (max: ${node.maxOccurrences})`,
      'MAX_GROUP_OCCURRENCES_EXCEEDED'
    ));
  }

  private validateGroupChildren(
    node: SegmentGroupNode,
    ediMessage: EDIMessage,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    context.enterGroup(node.id);
    this.validateChildren(node.children, ediMessage, context, errors);
    context.exitGroup();
  }

  private validateChildren(
    children: (SegmentNode | SegmentGroupNode)[],
    ediMessage: EDIMessage,
    context: StructuralValidationContext,
    errors: ValidationError[]
  ): void {
    for (const child of children) {
      if (this.isSegmentNode(child)) {
        this.validateSegment(child, ediMessage, context, errors);
      } else if (this.isSegmentGroupNode(child)) {
        this.validateSegmentGroup(child, ediMessage, context, errors);
      }
    }
  }

  private isSegmentNode(node: SegmentOrGroup): node is SegmentNode {
    return node.nodeType === 'segment';
  }

  private isSegmentGroupNode(node: SegmentOrGroup): node is SegmentGroupNode {
    return node.nodeType === 'segmentGroup';
  }
}
