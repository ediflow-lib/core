/**
 * Integration Tests for StructureMapper with Real EDIFACT Messages
 *
 * Tests Phase 2 Parsing: EDIMessage → Business Object
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { StructureMapper } from '@domain/mapping';
import type { MessageStructure } from '@domain/repositories';
import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
} from '@infrastructure/parsers/edifact';

describe('StructureMapper Integration Tests', () => {
  const mapper = new StructureMapper();

  function createParser() {
    const delimiterDetector = new EdifactDelimiterDetector();
    const tokenizer = new EdifactTokenizer();
    const segmentParser = new EdifactSegmentParser();
    return new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);
  }

  it('should map real ORDERS message to business object', () => {
    const ediString = readFileSync(
      join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
      'utf-8'
    );

    const parser = createParser();
    const ediMessage = parser.parse(ediString);

    const structure: MessageStructure = {
      standard: 'EDIFACT',
      version: 'D.96A',
      messageType: 'ORDERS',
      name: 'Purchase order message',
      structure: [
        {
          nodeType: 'segment',
          tag: 'BGM',
          name: 'Beginning of message',
          mandatory: true,
          maxOccurrences: 1,
          position: 10,
          elements: [],
          mapping: {
            targetField: 'documentNumber',
            elementIndex: 1,
          },
        },
      ],
    };

    const result = mapper.map<{ documentNumber: string }>(ediMessage, structure);

    expect(result).toBeDefined();
    expect(result.documentNumber).toBeDefined();
  });

  it('should map real DESADV message', () => {
    const ediString = readFileSync(
      join(__dirname, '../fixtures/edifact/happy-path/desadv-valid-d96a.edi'),
      'utf-8'
    );

    const parser = createParser();
    const ediMessage = parser.parse(ediString);

    const structure: MessageStructure = {
      standard: 'EDIFACT',
      version: 'D.96A',
      messageType: 'DESADV',
      name: 'Despatch advice',
      structure: [
        {
          nodeType: 'segment',
          tag: 'BGM',
          name: 'Beginning',
          mandatory: true,
          maxOccurrences: 1,
          position: 10,
          elements: [],
          mapping: {
            targetField: 'docNumber',
            elementIndex: 1,
          },
        },
      ],
    };

    const result = mapper.map<{ docNumber: string }>(ediMessage, structure);
    expect(result.docNumber).toBeDefined();
  });

  it('should map real INVOIC message', () => {
    const ediString = readFileSync(
      join(__dirname, '../fixtures/edifact/happy-path/invoic-valid-d01b.edi'),
      'utf-8'
    );

    const parser = createParser();
    const ediMessage = parser.parse(ediString);

    const structure: MessageStructure = {
      standard: 'EDIFACT',
      version: 'D.01B',
      messageType: 'INVOIC',
      name: 'Invoice',
      structure: [
        {
          nodeType: 'segment',
          tag: 'BGM',
          name: 'Beginning',
          mandatory: true,
          maxOccurrences: 1,
          position: 10,
          elements: [],
          mapping: {
            targetField: 'invoiceNum',
            elementIndex: 1,
          },
        },
      ],
    };

    const result = mapper.map<{ invoiceNum: string }>(ediMessage, structure);
    expect(result.invoiceNum).toBeDefined();
  });
});
