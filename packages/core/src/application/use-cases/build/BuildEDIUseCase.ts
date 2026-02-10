import { BuildEDIInputDTO } from './BuildEDIInputDTO';
import { BuildEDIOutputDTO, BuildError } from './BuildEDIOutputDTO';
import { EDIMessage, MessageType, Version } from '@domain';
import { EDIMessageValidationService } from '@application/services';
import { StructureMappingService } from '@application/services/StructureMappingService';
import {
  IMessageBuilder,
  IEnvelopeBuilder,
  MessageEnvelopeOptions,
  InterchangeEnvelopeOptions,
  OutputFormat
} from '@application/ports/output';

export class BuildEDIUseCase {
  constructor(
    private readonly messageBuilder: IMessageBuilder,
    private readonly envelopeBuilder?: IEnvelopeBuilder,
    private readonly structureMappingService?: StructureMappingService
  ) {}

  execute(input: BuildEDIInputDTO): BuildEDIOutputDTO {
    try {
      let message = this.getMessageFromInput(input);
      if (!message) {
        return this.createMissingInputError();
      }

      if (input.includeEnvelope) {
        const validationError = this.validateEnvelopeConfig(input);
        if (validationError) {
          return validationError;
        }

        message = this.wrapWithEnvelope(message, input);
      }

      if (input.validateBeforeBuild) {
        const validationError = this.validateMessage(message);
        if (validationError) {
          return validationError;
        }
      }

      const ediString = this.messageBuilder.build(message, {
        delimiters: input.delimiters,
        format: input.format || OutputFormat.COMPACT
      });

      return {
        success: true,
        ediString,
      };
    } catch (error) {
      return this.createBuildError(error);
    }
  }

  private getMessageFromInput(input: BuildEDIInputDTO): EDIMessage | null {
    if (input.businessObject && input.messageStructure && this.structureMappingService) {
      return this.structureMappingService.unmap(input.businessObject, input.messageStructure);
    }

    if (input.message) {
      return input.message;
    }

    return null;
  }

  private createMissingInputError(): BuildEDIOutputDTO {
    return {
      success: false,
      errors: [{
        code: 'MISSING_INPUT',
        message: 'Either message or businessObject+messageStructure must be provided',
      }],
    };
  }

  private validateMessage(message: EDIMessage): BuildEDIOutputDTO | null {
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

    return null;
  }

  private createBuildError(error: unknown): BuildEDIOutputDTO {
    return {
      success: false,
      errors: [{
        code: 'BUILD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }],
    };
  }

  private validateEnvelopeConfig(input: BuildEDIInputDTO): BuildEDIOutputDTO | null {
    if (!this.envelopeBuilder) {
      return {
        success: false,
        errors: [{
          code: 'MISSING_ENVELOPE_BUILDER',
          message: 'EnvelopeBuilder is required when includeEnvelope is true',
        }],
      };
    }

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

    const messageOptions: MessageEnvelopeOptions = {
      messageRef,
      messageType: this.parseMessageType(input.messageType!, message.standard),
      version: this.parseVersion(input.version!, message.standard)
    };

    let wrapped = this.envelopeBuilder!.wrapMessage(message, messageOptions);

    if (input.includeInterchange) {
      const controlRef = input.controlRef || this.generateControlRef();
      const dateTime = input.interchangeDateTime || new Date();

      const interchangeOptions: InterchangeEnvelopeOptions = {
        controlRef,
        sender: input.sender!,
        receiver: input.receiver!,
        dateTime
      };

      wrapped = this.envelopeBuilder!.wrapInterchange([wrapped], interchangeOptions);
    }

    return wrapped;
  }

  private parseMessageType(value: string, standard: any): MessageType {
    return new MessageType(standard, value);
  }

  private parseVersion(value: string, standard: any): Version {
    return new Version(standard, value);
  }

  private generateMessageRef(): string {
    return Date.now().toString();
  }

  private generateControlRef(): string {
    return `REF${Date.now()}`;
  }
}
