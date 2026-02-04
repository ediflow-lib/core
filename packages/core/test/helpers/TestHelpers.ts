/**
 * Test Helpers for Core Tests
 *
 * Provides factory functions and utilities for creating test doubles
 * (mocks, stubs, fakes) to test use cases without depending on
 * concrete format implementations.
 *
 * Follows Clean Code principles:
 * - Descriptive function names (createMockParser, not mockParser)
 * - Single Responsibility (each function creates one type of test double)
 * - DRY (reusable across all test files)
 */

import { vi } from 'vitest';
import type { IMessageParser } from '@application';
import { EDIMessage, Standard, Version, MessageType, EDISegment, Delimiters } from '@domain';

/**
 * Creates a mock IMessageParser for testing
 */
export function createMockParser(options?: {
  standard?: Standard;
  version?: string;
  messageType?: string;
  shouldFail?: boolean;
}): IMessageParser {
  const {
    standard = Standard.EDIFACT,
    version = 'D.96A',
    messageType = 'ORDERS',
    shouldFail = false
  } = options || {};

  return {
    parse: vi.fn().mockImplementation((_ediString: string) => {
      if (shouldFail) {
        throw new Error('Mock parser error');
      }

      const message = new EDIMessage(
        standard,
        new Version(standard, version),
        new MessageType(standard, messageType)
      );

      // Add mock segments
      message.addSegment(new EDISegment('UNB', []));
      message.addSegment(new EDISegment('UNH', []));
      message.addSegment(new EDISegment('UNT', []));
      message.addSegment(new EDISegment('UNZ', []));

      return message;
    }),
    getSupportedStandard: vi.fn().mockReturnValue(standard),
    canParse: vi.fn().mockReturnValue(true)
  };
}

/**
 * Creates a mock EDI message for testing
 */
export function createMockMessage(options?: {
  standard?: Standard;
  version?: string;
  messageType?: string;
  segmentCount?: number;
}): EDIMessage {
  const {
    standard = Standard.EDIFACT,
    version = 'D.96A',
    messageType = 'ORDERS',
    segmentCount = 4
  } = options || {};

  const message = new EDIMessage(
    standard,
    new Version(standard, version),
    new MessageType(standard, messageType)
  );

  for (let i = 0; i < segmentCount; i++) {
    message.addSegment(new EDISegment(`SEG${i}`, []));
  }

  return message;
}

/**
 * Creates mock delimiters for testing
 */
export function createMockDelimiters(): Delimiters {
  return Delimiters.custom({
    segment: "'",
    element: '+',
    component: ':',
    decimal: '.',
    escape: '?'
  });
}
