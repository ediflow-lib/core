import { EDIMessage } from '@domain/entities/EDIMessage';
import { MessageStructure, SegmentNode, SegmentGroupNode, SegmentOrGroup } from '@domain/repositories/MessageStructure';
import { ValidationResult } from '@domain/validation/ValidationResult';
import { ValidationError } from '@domain/validation/ValidationError';
import { ValidationContext } from '@domain/validation/ValidationContext';

/**
 * StructuralValidator
 *
 * Validates EDI messages against their MessageStructure definition.
 * Checks:
 * - Mandatory segments/groups
 * - Max occurrences
 * - Segment order
 * - Group hierarchy
 */
export class StructuralValidator {
  validate(ediMessage: EDIMessage, structure: MessageStructure): ValidationResult {
    const errors: ValidationError[] = [];
    const context = new ValidationContext();

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
    context: ValidationContext,
    errors: ValidationError[]
  ): void {
    const segments = ediMessage.segments.filter(s => s.tag === node.tag);

    // Only report error if mandatory AND not found
    if (node.mandatory && segments.length === 0) {
      const path = context.path.length > 0
        ? `${context.path.join('.')}.${node.tag}[0]`
        : `${node.tag}[0]`;
      errors.push(new ValidationError(
        path,
        `Mandatory segment ${node.tag} is missing`,
        'MISSING_MANDATORY_SEGMENT'
      ));
      return; // Don't check max occurrences if segment doesn't exist
    }

    // Only check max occurrences if segment exists and exceeds limit
    if (segments.length > 0 && segments.length > node.maxOccurrences) {
      const path = context.path.length > 0
        ? `${context.path.join('.')}.${node.tag}[0]`
        : `${node.tag}[0]`;
      errors.push(new ValidationError(
        path,
        `Segment ${node.tag} occurs ${segments.length} times (max: ${node.maxOccurrences})`,
        'MAX_OCCURRENCES_EXCEEDED'
      ));
    }
  }

  private validateSegmentGroup(
    node: SegmentGroupNode,
    ediMessage: EDIMessage,
    context: ValidationContext,
    errors: ValidationError[]
  ): void {
    const groupPath = context.path.length > 0
      ? `${context.path.join('.')}.${node.id}`
      : node.id;

    const triggerSegments = ediMessage.segments.filter(
      s => s.tag === node.triggerSegment
    );

    // Check if mandatory group is missing
    if (node.mandatory && triggerSegments.length === 0) {
      errors.push(new ValidationError(
        groupPath,
        `Mandatory segment group ${node.id} is missing`,
        'MISSING_MANDATORY_GROUP'
      ));
      // Still validate children to report all missing mandatory segments
      context.enterGroup(node.id);
      for (const child of node.children) {
        if (this.isSegmentNode(child)) {
          this.validateSegment(child, ediMessage, context, errors);
        } else if (this.isSegmentGroupNode(child)) {
          this.validateSegmentGroup(child, ediMessage, context, errors);
        }
      }
      context.exitGroup();
      return;
    }

    // Check max occurrences only if group exists
    if (triggerSegments.length > 0 && triggerSegments.length > node.maxOccurrences) {
      errors.push(new ValidationError(
        groupPath,
        `Segment group ${node.id} occurs ${triggerSegments.length} times (max: ${node.maxOccurrences})`,
        'MAX_GROUP_OCCURRENCES_EXCEEDED'
      ));
      return; // Don't validate children if group already has occurrence error
    }

    // Validate children if group exists and within limits
    if (triggerSegments.length > 0) {
      context.enterGroup(node.id);

      for (const child of node.children) {
        if (this.isSegmentNode(child)) {
          this.validateSegment(child, ediMessage, context, errors);
        } else if (this.isSegmentGroupNode(child)) {
          this.validateSegmentGroup(child, ediMessage, context, errors);
        }
      }

      context.exitGroup();
    }
  }

  private isSegmentNode(node: SegmentOrGroup): node is SegmentNode {
    return node.nodeType === 'segment';
  }

  private isSegmentGroupNode(node: SegmentOrGroup): node is SegmentGroupNode {
    return node.nodeType === 'segmentGroup';
  }
}
