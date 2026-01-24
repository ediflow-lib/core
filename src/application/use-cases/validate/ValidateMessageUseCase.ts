import { ValidateMessageInputDTO } from './ValidateMessageInputDTO';
import { ValidateMessageOutputDTO } from './ValidateMessageOutputDTO';
import type { IValidationService } from '@domain/services/IValidationService';
import type { EDIMessage } from '@domain';

/**
 * Use Case for validating EDI messages.
 * Coordinates with validation service to check message structure and content.
 *
 * Clean Architecture: This Use Case depends on IValidationService (interface),
 * not on concrete implementations.
 */
export class ValidateMessageUseCase {
  constructor(private readonly validationService: IValidationService<EDIMessage>) {}

  execute(input: ValidateMessageInputDTO): ValidateMessageOutputDTO {
    try {
      // Validate message using injected service
      const validationResult = this.validationService.validate(input.message);

      // Return success with validation result and metadata
      return {
        success: true,
        validationResult,
        metadata: {
          standard: input.message.standard,
          version: input.message.version,
          messageType: input.message.messageType,
          segmentCount: input.message.segments.length,
        },
      };
    } catch (error) {
      // Return failure if validation service throws
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
  }
}
