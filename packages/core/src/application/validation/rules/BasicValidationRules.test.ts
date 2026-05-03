import { describe, it, expect } from 'vitest';
import {
  MessageMustHaveSegmentsRule,
  VersionStandardMustMatchRule,
  MessageTypeStandardMustMatchRule,
} from './BasicValidationRules';
import { EDIMessage, EDISegment, EDIElement, Standard, Version, MessageType } from '@domain';

const createValidMessage = (): EDIMessage => {
  const msg = new EDIMessage(
    '1',
    Standard.EDIFACT,
    new Version(Standard.EDIFACT, 'D.20B'),
    new MessageType(Standard.EDIFACT, 'ORDERS'),
  );
  msg.addSegment(new EDISegment('BGM', [new EDIElement('220')]));
  return msg;
};

const createEmptyMessage = (): EDIMessage =>
  new EDIMessage(
    '1',
    Standard.EDIFACT,
    new Version(Standard.EDIFACT, 'D.20B'),
    new MessageType(Standard.EDIFACT, 'ORDERS'),
  );

describe('MessageMustHaveSegmentsRule', () => {
  const rule = new MessageMustHaveSegmentsRule();

  it('has correct ruleId and description', () => {
    expect(rule.ruleId).toBe('MESSAGE_MUST_HAVE_SEGMENTS');
    expect(rule.description).toContain('segment');
  });

  it('returns EMPTY_MESSAGE error for message with no segments', () => {
    const errors = rule.apply(createEmptyMessage());
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('EMPTY_MESSAGE');
  });

  it('returns no errors for message with at least one segment', () => {
    const errors = rule.apply(createValidMessage());
    expect(errors).toHaveLength(0);
  });
});

describe('VersionStandardMustMatchRule', () => {
  const rule = new VersionStandardMustMatchRule();

  it('has correct ruleId', () => {
    expect(rule.ruleId).toBe('VERSION_STANDARD_MUST_MATCH');
  });

  it('returns no errors when version standard matches message standard', () => {
    const errors = rule.apply(createValidMessage());
    expect(errors).toHaveLength(0);
  });

  it('returns STANDARD_MISMATCH error when version standard differs', () => {
    const msg = new EDIMessage(
      '1',
      Standard.EDIFACT,
      new Version(Standard.X12, '004010'),         // X12 version on EDIFACT message
      new MessageType(Standard.EDIFACT, 'ORDERS'),
    );
    msg.addSegment(new EDISegment('BGM', [new EDIElement('220')]));
    const errors = rule.apply(msg);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('STANDARD_MISMATCH');
    expect(errors[0].message).toContain('X12');
  });
});

describe('MessageTypeStandardMustMatchRule', () => {
  const rule = new MessageTypeStandardMustMatchRule();

  it('has correct ruleId', () => {
    expect(rule.ruleId).toBe('MESSAGE_TYPE_STANDARD_MUST_MATCH');
  });

  it('returns no errors when messageType standard matches message standard', () => {
    const errors = rule.apply(createValidMessage());
    expect(errors).toHaveLength(0);
  });

  it('returns STANDARD_MISMATCH error when messageType standard differs', () => {
    const msg = new EDIMessage(
      '1',
      Standard.EDIFACT,
      new Version(Standard.EDIFACT, 'D.20B'),
      new MessageType(Standard.X12, '850'),         // X12 type on EDIFACT message
    );
    msg.addSegment(new EDISegment('BGM', [new EDIElement('220')]));
    const errors = rule.apply(msg);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('STANDARD_MISMATCH');
    expect(errors[0].message).toContain('X12');
  });
});

