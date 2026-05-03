import type { IValidationRule } from '@application/ports';
import type { EDIMessage } from '@domain/entities/EDIMessage';
import type { EDISegment } from '@domain/value-objects/EDISegment';
import type { MessageStructureDTO, SegmentNode, ElementNode } from '@application/dtos';
import { ValidationError } from '@application/validation/ValidationError';

/**
 * CodeListRule
 *
 * Opt-in validation rule that checks element values against pre-loaded code lists.
 *
 * The caller provides a Map<codeListCode, Set<validValues>> so this rule has
 * zero I/O — loading happens in infrastructure (FileBasedRepository, etc.).
 *
 * Only validates elements that have a `codeListCode` defined in the structure.
 * Missing code list → skip (not an error — lenient by design).
 */
export class CodeListRule implements IValidationRule<EDIMessage> {
  readonly ruleId = 'CODE_LIST_VALIDATION';
  readonly description = 'Element values must be valid codes from their defined code list';

  constructor(
    private readonly messageStructure: MessageStructureDTO,
    private readonly codeLists: Map<string, Set<string>>
  ) {}

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
      this.validateElementCodes(node, segment, index, errors);
    });
  }

  private validateElementCodes(
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
      if (!elementNode.codeListCode) {
        continue;
      }

      const validCodes = this.codeLists.get(elementNode.codeListCode);
      if (!validCodes) {
        continue;
      }

      const value = segment.elements[elementNode.position - 1]?.value ?? '';
      if (value === '') {
        continue;
      }

      if (!validCodes.has(value)) {
        const fieldPath = `${node.tag}[${segmentIndex}].${elementNode.code}[${elementNode.position}]`;
        errors.push(new ValidationError(
          fieldPath,
          `Code '${value}' is not a valid value for element ${elementNode.codeListCode}`,
          'INVALID_CODE_VALUE'
        ));
      }
    }
  }
}

