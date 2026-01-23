import { ValidateMessageInputDTO } from './ValidateMessageInputDTO';
import { ValidateMessageOutputDTO, ValidationError } from './ValidateMessageOutputDTO';
import { EDIMessageValidationService } from '../../services';

export class ValidateMessageUseCase {
  execute(input: ValidateMessageInputDTO): ValidateMessageOutputDTO {
    const validator = new EDIMessageValidationService();
    const validationResult = validator.validate(input.message);

    if (validationResult.isValid) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
      };
    }

    const errors: ValidationError[] = validationResult.errors.map(err => ({
      field: err.field,
      code: err.code || 'VALIDATION_ERROR',
      message: err.message,
      segmentPosition: undefined,
      elementPosition: undefined,
    }));

    return {
      isValid: false,
      errors,
      warnings: [],
    };
  }
}
