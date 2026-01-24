import { BuildEDIInputDTO } from './BuildEDIInputDTO';
import { BuildEDIOutputDTO, BuildError } from './BuildEDIOutputDTO';
import { StandardDelimiters, EDIMessage, Delimiters } from '@domain';
import { EDIMessageValidationService } from '../../services';

export class BuildEDIUseCase {
  execute(input: BuildEDIInputDTO): BuildEDIOutputDTO {
    if (input.validateBeforeBuild) {
      const validator = new EDIMessageValidationService();
      const validationResult = validator.validate(input.message);

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

    const delimiters = input.delimiters || StandardDelimiters.getDefault(input.message.standard);
    const ediString = this.buildString(input.message, delimiters);

    return {
      success: true,
      ediString,
    };
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
