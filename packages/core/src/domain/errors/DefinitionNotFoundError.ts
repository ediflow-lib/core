import { Standard, Version, MessageType } from '@domain';

/**
 * Error thrown when a message definition cannot be found.
 */
export class DefinitionNotFoundError extends Error {
  constructor(
    public readonly standard: Standard,
    public readonly version: Version,
    public readonly messageType: MessageType
  ) {
    super(
      `Definition not found for ${standard.toString()} ${version.value} ${messageType.value}`
    );
    this.name = 'DefinitionNotFoundError';

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DefinitionNotFoundError);
    }
  }
}
