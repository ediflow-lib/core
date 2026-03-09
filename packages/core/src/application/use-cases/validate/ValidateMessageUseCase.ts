import { ValidateMessageInputDTO } from './ValidateMessageInputDTO';
import { ValidateMessageOutputDTO } from './ValidateMessageOutputDTO';
import type { IValidationService } from '@application/ports';
import type { EDIMessage } from '@domain';
import { StructuralValidationService } from '@application/services/StructuralValidationService';
import { CodeListRule } from '@application/validation/rules/CodeListRule';
import { ValidationResult } from '@application/validation';

/**
 * Use Case for validating EDI messages.
 *
 * Phase 1: Syntax Validation (via IValidationService)
 * Phase 2: Structure Validation (via StructuralValidationService) - optional
 *
 * Clean Architecture: This Use Case depends on IValidationService (interface),
 * not on concrete implementations.
 */
export class ValidateMessageUseCase {
  private readonly structuralValidator: StructuralValidationService;

  constructor(private readonly validationService: IValidationService<EDIMessage>) {
    this.structuralValidator = new StructuralValidationService();
  }

  execute(input: ValidateMessageInputDTO): ValidateMessageOutputDTO {
    try {
      const syntaxResult = this.validationService.validate(input.message);
      const structureResult = this.performStructuralValidation(input, syntaxResult);
      const finalResult = this.performCodeValidation(input, structureResult);

      return this.buildSuccessResponse(input.message, finalResult);
    } catch (error) {
      return this.buildErrorResponse(error);
    }
  }

  private performStructuralValidation(
    input: ValidateMessageInputDTO,
    syntaxResult: ValidationResult
  ): ValidationResult {
    if (!input.enableStructuralValidation || !input.messageStructure) {
      return syntaxResult;
    }

    if (input.strictMode && !syntaxResult.isValid) {
      return syntaxResult;
    }

    const structureResult = this.structuralValidator.validate(
      input.message,
      input.messageStructure
    );

    return this.mergeValidationResults(syntaxResult, structureResult);
  }

  private performCodeValidation(
    input: ValidateMessageInputDTO,
    previousResult: ValidationResult
  ): ValidationResult {
    if (!input.validateCodes || !input.messageStructure || !input.codeLists) {
      return previousResult;
    }

    if (input.strictMode && !previousResult.isValid) {
      return previousResult;
    }

    const codeRule = new CodeListRule(input.messageStructure, input.codeLists);
    const codeErrors = codeRule.apply(input.message);

    if (codeErrors.length === 0) {
      return previousResult;
    }

    return this.mergeValidationResults(previousResult, ValidationResult.failure(...codeErrors));
  }

  private buildSuccessResponse(
    message: EDIMessage,
    validationResult: ValidationResult
  ): ValidateMessageOutputDTO {
    return {
      success: true,
      validationResult,
      metadata: {
        standard: message.standard,
        version: message.version,
        messageType: message.messageType,
        segmentCount: message.segments.length,
      },
    };
  }

  private buildErrorResponse(error: unknown): ValidateMessageOutputDTO {
    return {
      success: false,
      errors: [
        {
          code: 'VALIDATION_SERVICE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error',
        },
      ],
    };
  }

  private mergeValidationResults(
    syntaxResult: ValidationResult,
    structureResult: ValidationResult
  ): ValidationResult {
    const allErrors = [...syntaxResult.errors, ...structureResult.errors];

    if (allErrors.length > 0) {
      return ValidationResult.failure(...allErrors);
    }

    return ValidationResult.success();
  }
}
