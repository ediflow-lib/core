import { Standard } from './Standard';

/**
 * MessageType Value Object
 *
 * Represents an EDI message type (e.g., DESADV, INVOIC, ORDERS for EDIFACT)
 *
 * @example
 * const messageType = new MessageType(Standard.EDIFACT, 'DESADV');
 */
export class MessageType {
  constructor(
    public readonly standard: Standard,
    public readonly value: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.trim() === '') {
      throw new Error('MessageType value cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: MessageType): boolean {
    return this.standard === other.standard && this.value === other.value;
  }
}
