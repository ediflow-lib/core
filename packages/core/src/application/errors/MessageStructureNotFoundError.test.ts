import { describe, it, expect } from 'vitest';
import { MessageStructureNotFoundError } from './MessageStructureNotFoundError';
import { Standard, Version, MessageType } from '@domain';

describe('MessageStructureNotFoundError', () => {
  it('should set the error message with standard, version and messageType', () => {
    const standard = Standard.EDIFACT;
    const version = new Version(Standard.EDIFACT, 'D.96A');
    const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

    const error = new MessageStructureNotFoundError(standard, version, messageType);

    expect(error.message).toContain('D.96A');
    expect(error.message).toContain('ORDERS');
  });

  it('should set the error name to MessageStructureNotFoundError', () => {
    const error = new MessageStructureNotFoundError(
      Standard.EDIFACT,
      new Version(Standard.EDIFACT, 'D.96A'),
      new MessageType(Standard.EDIFACT, 'ORDERS'),
    );

    expect(error.name).toBe('MessageStructureNotFoundError');
  });

  it('should expose standard, version and messageType as readonly properties', () => {
    const standard = Standard.X12;
    const version = new Version(Standard.X12, '004010');
    const messageType = new MessageType(Standard.X12, '850');

    const error = new MessageStructureNotFoundError(standard, version, messageType);

    expect(error.standard).toBe(standard);
    expect(error.version).toBe(version);
    expect(error.messageType).toBe(messageType);
  });

  it('should be an instance of Error', () => {
    const error = new MessageStructureNotFoundError(
      Standard.EDIFACT,
      new Version(Standard.EDIFACT, 'D.96A'),
      new MessageType(Standard.EDIFACT, 'ORDERS'),
    );

    expect(error).toBeInstanceOf(Error);
  });
});

