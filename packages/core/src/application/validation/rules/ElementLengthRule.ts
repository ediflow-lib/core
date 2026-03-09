import type { IValidationRule } from '@application/ports';
import type { EDIMessage } from '@domain/entities/EDIMessage';
import type { EDISegment } from '@domain/value-objects/EDISegment';
import type { MessageStructureDTO, SegmentNode, ElementNode } from '@application/dtos';
import { ValidationError } from '@application/validation/ValidationError';

// noinspection FunctionWithMultipleLoopsJS
/**
 * ElementLengthRule
 *
 * Validates element value lengths against minLength and maxLength defined
 * in the MessageStructureDTO. Empty values are skipped (use MandatoryElementRule).
 */
export class ElementLengthRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'ELEMENT_LENGTH_VALIDATION';
  readonly description = 'Element values must respect minLength and maxLength constraints';

  constructor(private readonly messageStructure: MessageStructureDTO) {}

  apply(message: EDIMessage): ValidationError[] {
    const errors: ValidationError[] = [];
    for (const node of this.messageStructure.structure) {
      if (node.nodeType === 'segment') {
        this.validateSegmentOccurrences(node as SegmentNode, message, errors);
      }
    }
    return errors;
  }

  private validateSegmentOccurrences(node: SegmentNode, message: EDIMessage, errors: ValidationError[]): void {
    let index = 0;
    for (const segment of message.segments) {
      if (segment.tag === node.tag) {
        this.validateLengths(node, segment, index, errors);
        index++;
      }
    }
  }

  private validateLengths(node: SegmentNode, segment: EDISegment, segmentIndex: number, errors: ValidationError[]): void {
    for (const elementDef of node.elements) {
      if (elementDef.nodeType !== 'element') {
        continue;
      }
      const elementNode = elementDef as ElementNode;
      const value = segment.elements[elementNode.position - 1]?.value ?? '';
      if (value === '') {
        continue;
      }
      const fieldPath = `${node.tag}[${segmentIndex}].${elementNode.code}[${elementNode.position}]`;
      this.checkMinLength(elementNode, value, fieldPath, errors);
      this.checkMaxLength(elementNode, value, fieldPath, errors);
    }
  }

  private checkMinLength(element: ElementNode, value: string, fieldPath: string, errors: ValidationError[]): void {
    if (element.minLength !== undefined && value.length < element.minLength) {
      errors.push(new ValidationError(
        fieldPath,
        `Element ${element.code} is too short: ${value.length} chars (min: ${element.minLength})`,
        'ELEMENT_TOO_SHORT'
      ));
    }
  }

  private checkMaxLength(element: ElementNode, value: string, fieldPath: string, errors: ValidationError[]): void {
    if (element.maxLength !== undefined && value.length > element.maxLength) {
      errors.push(new ValidationError(
        fieldPath,
        `Element ${element.code} is too long: ${value.length} chars (max: ${element.maxLength})`,
        'ELEMENT_TOO_LONG'
      ));
    }
  }
}

