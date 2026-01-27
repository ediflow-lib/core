import { BuildEDIInputDTO } from './BuildEDIInputDTO';
import { BuildEDIOutputDTO, BuildError } from './BuildEDIOutputDTO';
import { StandardDelimiters, EDIMessage, Delimiters } from '@domain';
import { EDIMessageValidationService } from '@application/services';
import { StructureMapper } from '@domain/mapping';

/**
 * Use Case for building EDI messages.
 *
 * Phase 1 (Reverse): Business Object → EDIMessage (Structure Unmapping) - US-6.2
 * Phase 2: EDIMessage → EDI String (Serialization)
 */
export class BuildEDIUseCase {
  constructor(
    private readonly structureMapper?: StructureMapper  // Optional: for Phase 2 (building from business object)
  ) {}

  execute(input: BuildEDIInputDTO): BuildEDIOutputDTO {
    try {
      // Phase 1 (Reverse): Business Object → EDIMessage (US-6.2)
      let message: EDIMessage;

      if (input.businessObject && input.messageStructure && this.structureMapper) {
        // Build from business object (Phase 2 reverse)
        message = this.structureMapper.unmap(input.businessObject, input.messageStructure);
      } else if (input.message) {
        // Direct EDIMessage provided (existing behavior)
        message = input.message;
      } else {
        return {
          success: false,
          errors: [{
            code: 'MISSING_INPUT',
            message: 'Either message or businessObject+messageStructure must be provided',
          }],
        };
      }

      // Validation (if requested)
      if (input.validateBeforeBuild) {
        const validator = new EDIMessageValidationService();
        const validationResult = validator.validate(message);

        if (!validationResult.isValid) {
          const errors: BuildError[] = validationResult.errors.map(err => ({
            code: err.code || 'VALIDATION_ERROR',
            message: err.message,
            field: err.field,
          }));

          return {
            success: false,
            errors,
          };
        }
      }

      // Phase 2: EDIMessage → EDI String (Serialization)
      const delimiters = input.delimiters || StandardDelimiters.getDefault(message.standard);
      const ediString = this.buildString(message, delimiters);

      return {
        success: true,
        ediString,
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'BUILD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        }],
      };
    }
  }

  private buildString(message: EDIMessage, delimiters: Delimiters): string {
    const segments: string[] = [];

    for (const segment of message.segments) {
      const elements: string[] = [segment.tag];

      for (const element of segment.elements) {
        elements.push(element.value);
      }

      segments.push(elements.join(delimiters.element));
    }

    return segments.join(delimiters.segment);
  }
}
