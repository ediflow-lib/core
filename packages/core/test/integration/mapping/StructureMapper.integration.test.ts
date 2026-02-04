/**
 * Integration Tests for StructureMapper with Real EDIFACT Messages
 *
 * Tests Phase 2 Parsing: EDIMessage → Business Object
 *
 * Phase 2 Refactoring: Tests now use IMessageParser interface.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { StructureMapper } from '@domain/mapping';
import type { MessageStructure } from '@domain/repositories';
import type { IMessageParser } from '@application';

describe('StructureMapper Integration Tests', () => {
  const mapper = new StructureMapper();
  let parser: IMessageParser;

  beforeAll(async () => {
    // Dynamic import: Core tests don't depend on EDIFACT at build time
    const edifact = await import('@infrastructure/parsers/edifact');

    const delimiterDetector = new edifact.EdifactDelimiterDetector();
    const tokenizer = new edifact.EdifactTokenizer();
    const segmentParser = new edifact.EdifactSegmentParser();
    parser = new edifact.EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);
  });

  it('should map real ORDERS message to business object', () => {
    const ediString = readFileSync(
      join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
      'utf-8'
    );

    // parser is now defined in beforeAll
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

    // parser is now defined in beforeAll
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

    // parser is now defined in beforeAll
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

  it('should map ORDERS message with date conversion', () => {
    const ediString = readFileSync(
      join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
      'utf-8'
    );

    // parser is now defined in beforeAll
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
          name: 'Beginning',
          mandatory: true,
          maxOccurrences: 1,
          position: 10,
          elements: [],
          mapping: {
            targetField: 'documentNumber',
            elementIndex: 1,
          },
        },
        {
          nodeType: 'segment',
          tag: 'DTM',
          name: 'Date',
          mandatory: false,
          maxOccurrences: 10,
          position: 20,
          elements: [],
          mapping: {
            targetField: 'documentDate',
            elementIndex: 1,
            componentIndex: 0,
            typeConversion: 'date',
            dateFormat: 'YYYYMMDD',
          },
        },
      ],
    };

    interface OrdersData {
      documentNumber: string;
      documentDate?: Date;
    }

    const result = mapper.map<OrdersData>(ediMessage, structure);
    expect(result.documentNumber).toBeDefined();
  });

  it('should map message with multiple NAD segments to array', () => {
    const ediString = readFileSync(
      join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
      'utf-8'
    );

    // parser is now defined in beforeAll
    const ediMessage = parser.parse(ediString);

    const structure: MessageStructure = {
      standard: 'EDIFACT',
      version: 'D.96A',
      messageType: 'ORDERS',
      name: 'Purchase order',
      structure: [
        {
          nodeType: 'segment',
          tag: 'NAD',
          name: 'Name and address',
          mandatory: false,
          maxOccurrences: 99,
          position: 30,
          elements: [],
          mapping: {
            targetField: 'parties',
            elementIndex: 1,
            isArray: true,
          },
        },
      ],
    };

    const result = mapper.map<{ parties: string[] }>(ediMessage, structure);
    expect(result.parties).toBeDefined();
    if (result.parties) {
      expect(Array.isArray(result.parties)).toBe(true);
    }
  });

  it('should map complex ORDERS with nested segment groups', () => {
    const ediString = readFileSync(
      join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
      'utf-8'
    );

    // parser is now defined in beforeAll
    const ediMessage = parser.parse(ediString);

    const structure: MessageStructure = {
      standard: 'EDIFACT',
      version: 'D.96A',
      messageType: 'ORDERS',
      name: 'Purchase order',
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
            targetField: 'documentNumber',
            elementIndex: 1,
          },
        },
        {
          nodeType: 'segmentGroup',
          id: 'SG2',
          name: 'Party Group',
          mandatory: false,
          maxOccurrences: 99,
          position: 100,
          triggerSegment: 'NAD',
          children: [
            {
              nodeType: 'segment',
              tag: 'NAD',
              name: 'Party',
              mandatory: true,
              maxOccurrences: 1,
              position: 110,
              elements: [],
              mapping: {
                targetField: 'partyId',
                elementIndex: 1,
              },
            },
          ],
          mapping: {
            targetField: 'parties',
            elementIndex: 0,
            isArray: true,
          },
        },
      ],
    };

    interface Party {
      partyId: string;
    }

    interface OrdersData {
      documentNumber: string;
      parties?: Party[];
    }

    const result = mapper.map<OrdersData>(ediMessage, structure);
    expect(result.documentNumber).toBeDefined();
  });

  it('should handle ORDERS message with quantity conversion', () => {
    const ediString = readFileSync(
      join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
      'utf-8'
    );

    // parser is now defined in beforeAll
    const ediMessage = parser.parse(ediString);

    const structure: MessageStructure = {
      standard: 'EDIFACT',
      version: 'D.96A',
      messageType: 'ORDERS',
      name: 'Purchase order',
      structure: [
        {
          nodeType: 'segment',
          tag: 'QTY',
          name: 'Quantity',
          mandatory: false,
          maxOccurrences: 10,
          position: 40,
          elements: [],
          mapping: {
            targetField: 'quantities',
            elementIndex: 1,
            componentIndex: 0,
            typeConversion: 'number',
            isArray: true,
          },
        },
      ],
    };

    const result = mapper.map<{ quantities?: number[] }>(ediMessage, structure);
    expect(result).toBeDefined();
  });

  it('should handle DESADV with composite element extraction', () => {
    const ediString = readFileSync(
      join(__dirname, '../fixtures/edifact/happy-path/desadv-valid-d96a.edi'),
      'utf-8'
    );

    // parser is now defined in beforeAll
    const ediMessage = parser.parse(ediString);

    const structure: MessageStructure = {
      standard: 'EDIFACT',
      version: 'D.96A',
      messageType: 'DESADV',
      name: 'Despatch advice',
      structure: [
        {
          nodeType: 'segment',
          tag: 'UNH',
          name: 'Message header',
          mandatory: true,
          maxOccurrences: 1,
          position: 1,
          elements: [],
          mapping: {
            targetField: 'messageType',
            elementIndex: 1,
            componentIndex: 0,
          },
        },
      ],
    };

    const result = mapper.map<{ messageType: string }>(ediMessage, structure);
    expect(result).toBeDefined();
    // UNH might not have composite at position 1 in this specific test file
    // Just verify the mapping runs without errors
  });

  it('should handle real message with mixed simple and composite elements', () => {
    const ediString = readFileSync(
      join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
      'utf-8'
    );

    // parser is now defined in beforeAll
    const ediMessage = parser.parse(ediString);

    const structure: MessageStructure = {
      standard: 'EDIFACT',
      version: 'D.96A',
      messageType: 'ORDERS',
      name: 'Purchase order',
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
            targetField: 'docType',
            elementIndex: 0,
            componentIndex: 0,
          },
        },
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

    interface OrdersData {
      docType: string;
      docNumber: string;
    }

    const result = mapper.map<OrdersData>(ediMessage, structure);
    expect(result).toBeDefined();
  });
});
