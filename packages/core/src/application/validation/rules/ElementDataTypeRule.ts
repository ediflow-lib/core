import type { IValidationRule } from '@application/ports';
import type { EDIMessage } from '@domain/entities/EDIMessage';
import type { EDISegment } from '@domain/value-objects/EDISegment';
import type { MessageStructureDTO, SegmentNode, ElementNode } from '@application/dtos';
import { ValidationError } from '@application/validation/ValidationError';

/**
 * ElementDataTypeRule
 *
 * Generic validation rule that checks element values against their defined dataType.
 * Works against the built MessageStructureDTO — no separate repository needed.
 *
 * Supported dataTypes:
 * - n  : numeric (digits + optional decimal point)
 * - a  : alphabetic (letters + spaces)
 * - an : alphanumeric (any character)
 * - id : identifier (any non-empty string — code validation is separate)
 * - dt : date (YYYYMMDD or YYMMDD)
 * - tm : time (HHMM, HHMMSS, HHMMSSdd)
 * - r  : decimal (numeric with optional decimal point)
 * - b  : binary (skip validation)
 */
export class ElementDataTypeRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'ELEMENT_DATA_TYPE';
  readonly description = 'Element values must match their defined data type';

  constructor(private readonly messageStructure: MessageStructureDTO) {}

  apply(message: EDIMessage): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const node of this.messageStructure.structure) {
      if (node.nodeType !== 'segment') {
        continue;
      }
      const segmentNode = node as SegmentNode;
      this.collectSegmentErrors(segmentNode, message, errors);
    }

    return errors;
  }

  private collectSegmentErrors(
    node: SegmentNode,
    message: EDIMessage,
    errors: ValidationError[]
  ): void {
    const segments = message.segments.filter(s => s.tag === node.tag);
    segments.forEach((segment, index) => {
      this.validateSegmentElements(node, segment, index, errors);
    });
  }

  private validateSegmentElements(
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
      if (!elementNode.dataType) {
        continue;
      }

      const value = segment.elements[elementNode.position - 1]?.value ?? '';
      if (value === '') {
        continue;
      }

      const fieldPath = `${node.tag}[${segmentIndex}].${elementNode.code}[${elementNode.position}]`;
      const typeErrors = this.validateDataType(elementNode.dataType, value, fieldPath);
      errors.push(...typeErrors);
    }
  }

  private validateDataType(dataType: string, value: string, fieldPath: string): ValidationError[] {
    switch (dataType) {
      case 'n': return this.validateNumeric(value, fieldPath);
      case 'a': return this.validateAlphabetic(value, fieldPath);
      case 'an': return [];
      case 'id': return [];
      case 'dt': return this.validateDate(value, fieldPath);
      case 'tm': return this.validateTime(value, fieldPath);
      case 'r': return this.validateDecimal(value, fieldPath);
      case 'b': return [];
      default: return [];
    }
  }

  private validateNumeric(value: string, fieldPath: string): ValidationError[] {
    if (!/^\d+(\.\d+)?$/.test(value)) {
      return [new ValidationError(fieldPath, `Element must be numeric (type 'n'), got: '${value}'`, 'INVALID_DATA_TYPE')];
    }
    return [];
  }

  private validateAlphabetic(value: string, fieldPath: string): ValidationError[] {
    if (!/^[a-zA-Z ]+$/.test(value)) {
      return [new ValidationError(fieldPath, `Element must be alphabetic (type 'a'), got: '${value}'`, 'INVALID_DATA_TYPE')];
    }
    return [];
  }

  private validateDate(value: string, fieldPath: string): ValidationError[] {
    const isValidLength = value.length === 6 || value.length === 8;
    if (!isValidLength || !/^\d+$/.test(value)) {
      return [new ValidationError(fieldPath, `Element must be a date (YYYYMMDD or YYMMDD), got: '${value}'`, 'INVALID_DATE_FORMAT')];
    }
    return [];
  }

  private validateTime(value: string, fieldPath: string): ValidationError[] {
    const validLengths = [4, 6, 8];
    if (!validLengths.includes(value.length) || !/^\d+$/.test(value)) {
      return [new ValidationError(fieldPath, `Element must be a time (HHMM, HHMMSS, HHMMSSdd), got: '${value}'`, 'INVALID_TIME_FORMAT')];
    }
    return [];
  }

  private validateDecimal(value: string, fieldPath: string): ValidationError[] {
    if (!/^\d+(\.\d+)?$/.test(value)) {
      return [new ValidationError(fieldPath, `Element must be a decimal number (type 'r'), got: '${value}'`, 'INVALID_DATA_TYPE')];
    }
    return [];
  }
}



