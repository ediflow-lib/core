import { IValidationService, ValidationResult, ValidationError } from '../validation';
import { EDIMessage, EDISegment, EDIElement } from '@domain';

/**
 * EDIMessageValidationService
 *
 * Application Service that provides basic format-agnostic EDI validation.
 *
 * Validates:
 * - Message has segments
 * - Standard consistency (message.standard === version.standard)
 *
 * Format-specific validation (segment tag formats, element rules, etc.)
 * should be implemented in format packages (packages/edifact, packages/x12).
 */
export class EDIMessageValidationService implements IValidationService<EDIMessage> {
  validate(message: EDIMessage): ValidationResult {
    const errors: ValidationError[] = [];

    if (!message.isValid()) {
      errors.push(new ValidationError('segments', 'Message must have at least one segment', 'EMPTY_MESSAGE'));
    }

    if (message.standard !== message.version.standard) {
      errors.push(
        new ValidationError(
          'version',
          `Version standard (${message.version.standard}) does not match message standard (${message.standard})`,
          'STANDARD_MISMATCH'
        )
      );
    }

    if (message.standard !== message.messageType.standard) {
      errors.push(
        new ValidationError(
          'messageType',
          `MessageType standard (${message.messageType.standard}) does not match message standard (${message.standard})`,
          'STANDARD_MISMATCH'
        )
      );
    }

    return errors.length === 0 ? ValidationResult.success() : ValidationResult.failure(...errors);
  }

  validateSegment(segment: EDISegment): ValidationResult {
    const errors: ValidationError[] = [];

    if (!segment.tag || segment.tag.trim() === '') {
      errors.push(new ValidationError('tag', 'Segment tag cannot be empty', 'EMPTY_TAG'));
    }

    return errors.length === 0 ? ValidationResult.success() : ValidationResult.failure(...errors);
  }

  validateElement(element: EDIElement): ValidationResult {
    const errors: ValidationError[] = [];

    if (element.isComposite()) {
      if (element.components.every(c => !c || c.trim() === '')) {
        errors.push(
          new ValidationError('components', 'Composite element cannot have all empty components', 'EMPTY_COMPOSITE')
        );
      }
    }

    return errors.length === 0 ? ValidationResult.success() : ValidationResult.failure(...errors);
  }
}
