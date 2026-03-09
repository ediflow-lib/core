import type { IValidationRule } from '@application/ports';
import type { EDIMessage } from '@domain/entities/EDIMessage';
import type { EDISegment } from '@domain/value-objects/EDISegment';
import type { MessageStructureDTO, SegmentNode, ElementNode } from '@application/dtos';
import { ValidationError } from '@application/validation/ValidationError';

/**
 * MandatoryElementRule
 *
 * Standalone rule that checks all mandatory elements across every present segment.
 * Complements StructuralValidationService which handles mandatory segments/groups.
 *
 * Only validates segments that are present in the message — if a mandatory segment
 * itself is absent, StructuralValidationService reports that error.
 */
export class MandatoryElementRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'MANDATORY_ELEMENT_VALIDATION';
  readonly description = 'Mandatory elements must be present and non-empty';

  constructor(private readonly messageStructure: MessageStructureDTO) {}

  apply(message: EDIMessage): ValidationError[] {
    const errors: ValidationError[] = [];
    for (const node of this.messageStructure.structure) {
      if (node.nodeType === 'segment') {
        this.collectSegmentErrors(node as SegmentNode, message, errors);
      }
    }

    return errors;
  }

  private collectSegmentErrors(node: SegmentNode, message: EDIMessage, errors: ValidationError[]): void {
    let segmentIndex = 0;
    for (const segment of message.segments) {
      if (segment.tag === node.tag) {
        this.validateMandatoryElements(node, segment, segmentIndex, errors);
        segmentIndex++;
      }
    }
  }

  private validateMandatoryElements(
    node: SegmentNode,
    segment: EDISegment,
    segmentIndex: number,
    errors: ValidationError[]
  ): void {
    for (const elementDef of node.elements) {
      if (elementDef.nodeType !== 'element') {
        continue;
      }
      const elementNode = elementDef as ElementNode;
      if (!elementNode.mandatory) {
        continue;
      }

      const value = segment.elements[elementNode.position - 1]?.value ?? '';
      if (value === '') {
        const fieldPath = `${node.tag}[${segmentIndex}].${elementNode.code}[${elementNode.position}]`;
        errors.push(new ValidationError(
          fieldPath,
          `Mandatory element ${elementNode.code} is missing or empty`,
          'MISSING_MANDATORY_ELEMENT'
        ));
      }
    }
  }
}

