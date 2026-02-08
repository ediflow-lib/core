import { EDIMessage, Standard, Version, MessageType } from '@domain';
import { EntityIdGenerator } from '@application/services';

/**
 * EDIMessage Creation Options
 */
export interface EDIMessageOptions {
  standard: Standard;
  version: Version;
  messageType: MessageType;
}

/**
 * EDIMessageFactory
 *
 * Application-layer factory for creating EDIMessage entities with auto-generated IDs.
 * Uses options object pattern to avoid constructor telescoping problem.
 *
 * Why Options Object instead of 4+ parameters?
 * - ✅ Named parameters (clear what each value means)
 * - ✅ Extensible (add new fields without breaking changes)
 * - ✅ Readable (self-documenting code)
 * - ✅ Optional parameters possible
 *
 * Why Factory instead of EDIMessage.create()?
 * - Keeps Domain pure (no crypto/UUID dependency)
 * - Tests can use constructor directly with deterministic IDs
 * - ID generation strategy can vary per environment
 */
export class EDIMessageFactory {
  /**
   * Creates a new EDIMessage with auto-generated UUID.
   *
   * @example
   * const message = EDIMessageFactory.create({
   *   standard: Standard.EDIFACT,
   *   version: new Version(Standard.EDIFACT, 'D.96A'),
   *   messageType: new MessageType(Standard.EDIFACT, 'ORDERS')
   * });
   */
  static create(options: EDIMessageOptions): EDIMessage {
    return new EDIMessage(
      EntityIdGenerator.generate(),
      options.standard,
      options.version,
      options.messageType
    );
  }

  /**
   * Creates a new EDIMessage with specific ID (useful for testing).
   */
  static createWithId(id: string, options: EDIMessageOptions): EDIMessage {
    return new EDIMessage(
      id,
      options.standard,
      options.version,
      options.messageType
    );
  }
}
