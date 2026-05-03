import { describe, it, expect, beforeEach } from 'vitest';
import { MappingKeyTransformer } from './MappingKeyTransformer';
import type { SegmentNode, SegmentGroupNode, ElementNode, CompositeElementNode } from '@application/dtos';

describe('MappingKeyTransformer', () => {
  let transformer: MappingKeyTransformer;

  beforeEach(() => {
    transformer = new MappingKeyTransformer();
  });

  // ── transform() ────────────────────────────────────────────────────────────

  describe('transform()', () => {
    const cases: Array<[string, string, string, string, string]> = [
      // rawName,                 name,                  camelCase,             snake_case,             kebab-case
      ['Beginning of message',   'Beginning of message', 'beginningOfMessage',  'beginning_of_message', 'beginning-of-message'],
      ['Document identifier',    'Document identifier',  'documentIdentifier',  'document_identifier',  'document-identifier'],
      ['Date/time/period',       'Date/time/period',     'dateTimePeriod',      'date_time_period',     'date-time-period'],
      ['Name and address',       'Name and address',     'nameAndAddress',      'name_and_address',     'name-and-address'],
      ['BGM',                    'BGM',                  'bgm',                 'bgm',                  'bgm'],
      ['Line item',              'Line item',            'lineItem',            'line_item',             'line-item'],
    ];

    for (const [rawName, expectedName, expectedCamel, expectedSnake, expectedKebab] of cases) {
      it(`transforms "${rawName}" correctly`, () => {
        expect(transformer.transform(rawName, 'name')).toBe(expectedName);
        expect(transformer.transform(rawName, 'camelCase')).toBe(expectedCamel);
        expect(transformer.transform(rawName, 'snake_case')).toBe(expectedSnake);
        expect(transformer.transform(rawName, 'kebab-case')).toBe(expectedKebab);
      });
    }

    it('returns rawName unchanged for strategy "code"', () => {
      expect(transformer.transform('Document identifier', 'code')).toBe('Document identifier');
    });
  });

  // ── segmentKey() ───────────────────────────────────────────────────────────

  describe('segmentKey()', () => {
    const node = {
      nodeType: 'segment', tag: 'BGM', name: 'Beginning of message',
      mandatory: true, maxOccurrences: 1, position: 10, elements: []
    } as SegmentNode;

    it('returns tag for strategy "code"',       () => expect(transformer.segmentKey(node, 'code')).toBe('BGM'));
    it('returns name for strategy "name"',      () => expect(transformer.segmentKey(node, 'name')).toBe('Beginning of message'));
    it('returns camelCase for "camelCase"',     () => expect(transformer.segmentKey(node, 'camelCase')).toBe('beginningOfMessage'));
    it('returns snake_case for "snake_case"',   () => expect(transformer.segmentKey(node, 'snake_case')).toBe('beginning_of_message'));
    it('returns kebab-case for "kebab-case"',   () => expect(transformer.segmentKey(node, 'kebab-case')).toBe('beginning-of-message'));
  });

  // ── groupKey() ─────────────────────────────────────────────────────────────

  describe('groupKey()', () => {
    const node = {
      nodeType: 'segmentGroup', id: 'SG1', name: 'References',
      mandatory: false, maxOccurrences: 99, position: 30,
      triggerSegment: 'RFF', children: []
    } as SegmentGroupNode;

    it('returns id for strategy "code"',        () => expect(transformer.groupKey(node, 'code')).toBe('SG1'));
    it('returns name for strategy "name"',      () => expect(transformer.groupKey(node, 'name')).toBe('References'));
    it('returns camelCase for "camelCase"',     () => expect(transformer.groupKey(node, 'camelCase')).toBe('references'));
    it('returns snake_case for "snake_case"',   () => expect(transformer.groupKey(node, 'snake_case')).toBe('references'));
    it('returns kebab-case for "kebab-case"',   () => expect(transformer.groupKey(node, 'kebab-case')).toBe('references'));
  });

  // ── elementKey() ───────────────────────────────────────────────────────────

  describe('elementKey() — simple element', () => {
    const node = {
      nodeType: 'element', code: '1004', name: 'Document identifier',
      mandatory: true, position: 2, dataType: 'an', maxLength: 35
    } as ElementNode;

    it('returns code for strategy "code"',      () => expect(transformer.elementKey(node, 'code')).toBe('1004'));
    it('returns name for strategy "name"',      () => expect(transformer.elementKey(node, 'name')).toBe('Document identifier'));
    it('returns camelCase for "camelCase"',     () => expect(transformer.elementKey(node, 'camelCase')).toBe('documentIdentifier'));
    it('returns snake_case for "snake_case"',   () => expect(transformer.elementKey(node, 'snake_case')).toBe('document_identifier'));
    it('returns kebab-case for "kebab-case"',   () => expect(transformer.elementKey(node, 'kebab-case')).toBe('document-identifier'));
  });

  describe('elementKey() — composite element', () => {
    const node = {
      nodeType: 'composite', code: 'C507', name: 'Date time period',
      mandatory: true, position: 1, components: []
    } as CompositeElementNode;

    it('returns code for strategy "code"',      () => expect(transformer.elementKey(node, 'code')).toBe('C507'));
    it('returns camelCase for "camelCase"',     () => expect(transformer.elementKey(node, 'camelCase')).toBe('dateTimePeriod'));
    it('returns snake_case for "snake_case"',   () => expect(transformer.elementKey(node, 'snake_case')).toBe('date_time_period'));
  });
});


