import { IValidationService, ValidationResult, ValidationError, EDIMessage, EDISegment, EDIElement } from '../../domain';

/**
 * EDIMessageValidationService
 *
 * Application Service that validates EDI messages, segments, and elements.
 * Implements Domain Service Interface (IValidationService).
 */
export class EDIMessageValidationService implements IValidationService<EDIMessage> {
  private static readonly MAX_SEGMENT_TAG_LENGTH = 6;
  private static readonly SEGMENT_TAG_PATTERN = /^[A-Z0-9]+$/;

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
    } else {
      if (segment.tag.length > EDIMessageValidationService.MAX_SEGMENT_TAG_LENGTH) {
        errors.push(
          new ValidationError(
            'tag',
            `Segment tag length exceeds maximum of ${EDIMessageValidationService.MAX_SEGMENT_TAG_LENGTH}`,
            'TAG_TOO_LONG'
          )
        );
      }

      if (!EDIMessageValidationService.SEGMENT_TAG_PATTERN.test(segment.tag)) {
        errors.push(
          new ValidationError('tag', 'Segment tag must contain only alphanumeric characters', 'INVALID_TAG_FORMAT')
        );
      }
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
    } else {
      if (!element.value || element.value.trim() === '') {
        errors.push(new ValidationError('value', 'Simple element value cannot be empty', 'EMPTY_ELEMENT'));
      }
    }

    return errors.length === 0 ? ValidationResult.success() : ValidationResult.failure(...errors);
  }
}
