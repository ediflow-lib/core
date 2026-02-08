import { Standard, Version, MessageType } from '@domain';
import { ValidationResult } from '@application/validation';

/**
 * Discriminated union for Validate Message output.
 * TypeScript will narrow types correctly based on the `success` property.
 *
 * SUCCESS: validationResult is available (even if message has validation errors)
 * FAILURE: errors contains system errors (not validation errors!)
 */
export type ValidateMessageOutputDTO =
  | {
      success: true;
      validationResult: ValidationResult;
      metadata: {
        standard: Standard;
        version: Version;
        messageType: MessageType;
        segmentCount: number;
      };
    }
  | {
      success: false;
      errors: Array<{
        code: string;
        message: string;
      }>;
    };
