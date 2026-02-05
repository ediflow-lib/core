import { BuildEDIInputDTO } from './BuildEDIInputDTO';
import { BuildEDIOutputDTO, BuildError } from './BuildEDIOutputDTO';
import { EDIMessage, Delimiters } from '@domain';
import { EDISegment } from '@domain/entities/EDISegment';
import { EDIElement } from '@domain/entities/EDIElement';
import { EDIMessageValidationService } from '@application/services';
import { EnvelopeGenerator } from '@domain/services';
import { StructureMappingService } from '@application/services/StructureMappingService';

/**
 * Use Case for building EDI messages.
 *
 * Phase 1 (Reverse): Business Object → EDIMessage (Structure Unmapping) - US-6.2
 * Phase 2: EDIMessage → EDI String (Serialization)
 */
export class BuildEDIUseCase {
  private readonly envelopeGenerator: EnvelopeGenerator;

  constructor(
    private readonly structureMappingService?: StructureMappingService
  ) {
    this.envelopeGenerator = new EnvelopeGenerator();
  }

  execute(input: BuildEDIInputDTO): BuildEDIOutputDTO {
    try {
      let message: EDIMessage;

      if (input.businessObject && input.messageStructure && this.structureMappingService) {
        message = this.structureMappingService.unmap(input.businessObject, input.messageStructure);
      } else if (input.message) {
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

      if (input.includeEnvelope) {
        const validationError = this.validateEnvelopeConfig(input);
        if (validationError) {
          return validationError;
        }

        message = this.wrapWithEnvelope(message, input);
      }

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

      // Delimiters are REQUIRED - caller must provide them
      if (!input.delimiters) {
        return {
          success: false,
          errors: [{
            code: 'MISSING_DELIMITERS',
            message: 'Delimiters must be provided for building EDI message',
          }],
        };
      }

      const ediString = this.buildString(message, input.delimiters);

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

  private validateEnvelopeConfig(input: BuildEDIInputDTO): BuildEDIOutputDTO | null {
    if (!input.messageType || !input.version) {
      return {
        success: false,
        errors: [{
          code: 'MISSING_ENVELOPE_CONFIG',
          message: 'messageType and version are required when includeEnvelope is true',
        }],
      };
    }

    if (input.includeInterchange && (!input.sender || !input.receiver)) {
      return {
        success: false,
        errors: [{
          code: 'MISSING_INTERCHANGE_CONFIG',
          message: 'sender and receiver are required when includeInterchange is true',
        }],
      };
    }

    return null;
  }

  private wrapWithEnvelope(message: EDIMessage, input: BuildEDIInputDTO): EDIMessage {
    const messageRef = input.messageRef || this.generateMessageRef();
    const segments = [...message.segments];

    const businessSegmentCount = segments.length;
    const totalSegmentCount = businessSegmentCount + 2;

    const unh = this.envelopeGenerator.generateUNH(
      input.messageType!,
      input.version!,
      messageRef
    );

    const unt = this.envelopeGenerator.generateUNT(totalSegmentCount, messageRef);

    let wrappedSegments = [unh, ...segments, unt];

    if (input.includeInterchange) {
      const controlRef = input.controlRef || this.generateControlRef();
      const dateTime = input.interchangeDateTime || new Date();

      const unb = this.envelopeGenerator.generateUNB(
        input.sender!,
        input.receiver!,
        dateTime,
        controlRef
      );

      const unz = this.envelopeGenerator.generateUNZ(1, controlRef);

      wrappedSegments = [unb, ...wrappedSegments, unz];
    }

    const wrappedMessage = new EDIMessage(
      message.standard,
      message.version,
      message.messageType
    );

    for (const segment of wrappedSegments) {
      wrappedMessage.addSegment(segment);
    }

    return wrappedMessage;
  }

  private generateMessageRef(): string {
    return Date.now().toString();
  }

  private generateControlRef(): string {
    return `REF${Date.now()}`;
  }

  private buildString(message: EDIMessage, delimiters: Delimiters): string {
    const segmentStrings = message.segments.map(segment =>
      this.serializeSegment(segment, delimiters)
    );

    return segmentStrings.join(delimiters.segment) + delimiters.segment;
  }

  private serializeSegment(segment: EDISegment, delimiters: Delimiters): string {
    const elements = [
      segment.tag,
      ...segment.elements.map(element => this.serializeElement(element, delimiters))
    ];

    return elements.join(delimiters.element);
  }

  private serializeElement(element: EDIElement, delimiters: Delimiters): string {
    return element.isComposite()
      ? element.components.join(delimiters.component)
      : element.value;
  }
}
