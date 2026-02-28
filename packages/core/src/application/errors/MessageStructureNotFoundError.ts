import { Standard, Version, MessageType } from '@domain';

/**
 * Error thrown when a message structure cannot be found for the given standard/version/messageType.
 */
export class MessageStructureNotFoundError extends Error {
  constructor(
    public readonly standard: Standard,
    public readonly version: Version,
    public readonly messageType: MessageType
  ) {
    super(
      `Message structure not found for ${standard.toString()} ${version.value} ${messageType.value}`
    );
    this.name = 'MessageStructureNotFoundError';

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MessageStructureNotFoundError);
    }
  }
}
