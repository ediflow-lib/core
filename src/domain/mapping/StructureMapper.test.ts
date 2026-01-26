import { describe, it, expect, beforeEach } from 'vitest';
import { StructureMapper } from './StructureMapper';
import { EDIMessage, EDISegment, EDIElement } from '../entities';
import { Standard, Version, MessageType } from '../value-objects';
import type { MessageStructure, SegmentNode } from '../repositories';

describe('StructureMapper', () => {
  let mapper: StructureMapper;

  beforeEach(() => {
    mapper = new StructureMapper();
  });

  describe('map() - EDIMessage to Business Object', () => {
    it('should map a simple segment to a simple object field', () => {
      // Arrange: Create EDIMessage with one segment
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const segment = new EDISegment('BGM', [
        new EDIElement('220', []),  // Document type
        new EDIElement('DOC123', []),  // Document number
      ]);
      ediMessage.addSegment(segment);

      // Arrange: Create MessageStructure with mapping
      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
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
              elementIndex: 1,  // Second element
            },
          } as SegmentNode,
        ],
      };

      // Act
      const result = mapper.map<{ documentNumber: string }>(ediMessage, structure);

      // Assert
      expect(result).toBeDefined();
      expect(result.documentNumber).toBe('DOC123');
    });

    it('should map multiple segments to multiple object fields', () => {
      // Arrange
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const bgmSegment = new EDISegment('BGM', [
        new EDIElement('220', []),
        new EDIElement('DOC123', []),
      ]);
      ediMessage.addSegment(bgmSegment);

      const dtmSegment = new EDISegment('DTM', [
        new EDIElement('137', []),
        new EDIElement('20260126', []),
      ]);
      ediMessage.addSegment(dtmSegment);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
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
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'DTM',
            name: 'Date/time/period',
            mandatory: false,
            maxOccurrences: 1,
            position: 20,
            elements: [],
            mapping: {
              targetField: 'documentDate',
              elementIndex: 1,
              typeConversion: 'date',
              dateFormat: 'YYYYMMDD',
            },
          } as SegmentNode,
        ],
      };

      // Act
      const result = mapper.map<{ documentNumber: string; documentDate: Date }>(
        ediMessage,
        structure
      );

      // Assert
      expect(result.documentNumber).toBe('DOC123');
      expect(result.documentDate).toBeInstanceOf(Date);
      expect(result.documentDate.getFullYear()).toBe(2026);
      expect(result.documentDate.getMonth()).toBe(0); // January = 0
      expect(result.documentDate.getDate()).toBe(26);
    });

    it('should handle missing optional segments', () => {
      // Arrange
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const bgmSegment = new EDISegment('BGM', [
        new EDIElement('220', []),
        new EDIElement('DOC123', []),
      ]);
      ediMessage.addSegment(bgmSegment);
      // No DTM segment!

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
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
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'DTM',
            name: 'Date/time/period',
            mandatory: false,
            maxOccurrences: 1,
            position: 20,
            elements: [],
            mapping: {
              targetField: 'documentDate',
              elementIndex: 1,
              typeConversion: 'date',
            },
          } as SegmentNode,
        ],
      };

      // Act
      const result = mapper.map<{ documentNumber: string; documentDate?: Date }>(
        ediMessage,
        structure
      );

      // Assert
      expect(result.documentNumber).toBe('DOC123');
      expect(result.documentDate).toBeUndefined();
    });

    it('should map multiple segment occurrences to array', () => {
      // Arrange: Multiple NAD segments
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const nad1 = new EDISegment('NAD', [
        new EDIElement('SU', []),  // Supplier
        new EDIElement('1234567890', []),
      ]);
      ediMessage.addSegment(nad1);

      const nad2 = new EDISegment('NAD', [
        new EDIElement('BY', []),  // Buyer
        new EDIElement('0987654321', []),
      ]);
      ediMessage.addSegment(nad2);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
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
          } as SegmentNode,
        ],
      };

      // Act
      const result = mapper.map<{ parties: string[] }>(ediMessage, structure);

      // Assert
      expect(result.parties).toBeInstanceOf(Array);
      expect(result.parties).toHaveLength(2);
      expect(result.parties[0]).toBe('1234567890');
      expect(result.parties[1]).toBe('0987654321');
    });

    it('should convert string to number', () => {
      // Arrange
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const qtySegment = new EDISegment('QTY', [
        new EDIElement('21', []),
        new EDIElement('100', []),
      ]);
      ediMessage.addSegment(qtySegment);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
        structure: [
          {
            nodeType: 'segment',
            tag: 'QTY',
            name: 'Quantity',
            mandatory: false,
            maxOccurrences: 1,
            position: 40,
            elements: [],
            mapping: {
              targetField: 'quantity',
              elementIndex: 1,
              typeConversion: 'number',
            },
          } as SegmentNode,
        ],
      };

      // Act
      const result = mapper.map<{ quantity: number }>(ediMessage, structure);

      // Assert
      expect(result.quantity).toBe(100);
      expect(typeof result.quantity).toBe('number');
    });

    it('should handle segments without mapping rules', () => {
      // Arrange
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const unhSegment = new EDISegment('UNH', [
        new EDIElement('1', []),
      ]);
      ediMessage.addSegment(unhSegment);

      const bgmSegment = new EDISegment('BGM', [
        new EDIElement('220', []),
        new EDIElement('DOC123', []),
      ]);
      ediMessage.addSegment(bgmSegment);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            // NO mapping - technical segment
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'BGM',
            name: 'Beginning of message',
            mandatory: true,
            maxOccurrences: 1,
            position: 20,
            elements: [],
            mapping: {
              targetField: 'documentNumber',
              elementIndex: 1,
            },
          } as SegmentNode,
        ],
      };

      // Act
      const result = mapper.map<{ documentNumber: string }>(ediMessage, structure);

      // Assert
      expect(result.documentNumber).toBe('DOC123');
      // UNH should be ignored (no mapping)
    });
  });

  describe('Type Conversions', () => {
    it('should parse date in YYYYMMDD format', () => {
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const dtm = new EDISegment('DTM', [
        new EDIElement('20260126', []),
      ]);
      ediMessage.addSegment(dtm);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'DTM',
            name: 'Date',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'date',
              elementIndex: 0,
              typeConversion: 'date',
              dateFormat: 'YYYYMMDD',
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ date: Date }>(ediMessage, structure);

      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.getFullYear()).toBe(2026);
    });

    it('should parse date in YYMMDD format', () => {
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const dtm = new EDISegment('DTM', [
        new EDIElement('260126', []),
      ]);
      ediMessage.addSegment(dtm);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'DTM',
            name: 'Date',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'date',
              elementIndex: 0,
              typeConversion: 'date',
              dateFormat: 'YYMMDD',
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ date: Date }>(ediMessage, structure);

      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.getFullYear()).toBe(2026);
    });

    it('should convert string to boolean', () => {
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const seg = new EDISegment('TST', [
        new EDIElement('1', []),
      ]);
      ediMessage.addSegment(seg);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'TST',
            name: 'Test',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'flag',
              elementIndex: 0,
              typeConversion: 'boolean',
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ flag: boolean }>(ediMessage, structure);

      expect(result.flag).toBe(true);
      expect(typeof result.flag).toBe('boolean');
    });
  });

  describe('Composite Elements', () => {
    it('should extract value from composite element using componentIndex', () => {
      // Arrange: UNH segment with S009 composite (Message identifier)
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      // UNH has composite element at position 1 with components
      const compositeElement = new EDIElement('', ['ORDERS', 'D', '96A', 'UN']);

      const unhSegment = new EDISegment('UNH', [
        new EDIElement('1', []),  // Message reference (simple)
        compositeElement,         // S009 composite
      ]);
      ediMessage.addSegment(unhSegment);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'messageType',
              elementIndex: 1,      // S009 composite
              componentIndex: 0,    // First component = message type
            },
          } as SegmentNode,
        ],
      };

      // Act
      const result = mapper.map<{ messageType: string }>(ediMessage, structure);

      // Assert
      expect(result.messageType).toBe('ORDERS');
    });

    it('should map multiple components from same composite to different fields', () => {
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const compositeElement = new EDIElement('', ['ORDERS', 'D', '96A', 'UN']);

      const unhSegment = new EDISegment('UNH', [
        new EDIElement('1', []),
        compositeElement,
      ]);
      ediMessage.addSegment(unhSegment);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'messageType',
              elementIndex: 1,
              componentIndex: 0,
            },
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header version',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'messageVersion',
              elementIndex: 1,
              componentIndex: 1,
            },
          } as SegmentNode,
        ],
      };

      // Act
      const result = mapper.map<{ messageType: string; messageVersion: string }>(
        ediMessage,
        structure
      );

      // Assert
      expect(result.messageType).toBe('ORDERS');
      expect(result.messageVersion).toBe('D');
    });
  });

  describe('Nested Objects (Segment Groups)', () => {
    it('should map segment group to nested object', () => {
      // Arrange: NAD segment group with nested structure
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      // NAD segment (party)
      const nadSegment = new EDISegment('NAD', [
        new EDIElement('SU', []),  // Party qualifier (Supplier)
        new EDIElement('1234567890', []),  // Party ID
      ]);
      ediMessage.addSegment(nadSegment);

      // CTA segment (contact - part of NAD group)
      const ctaSegment = new EDISegment('CTA', [
        new EDIElement('PD', []),  // Contact function
        new EDIElement('John Doe', []),  // Contact name
      ]);
      ediMessage.addSegment(ctaSegment);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG2',
            name: 'Name and Address Group',
            mandatory: false,
            maxOccurrences: 99,
            position: 100,
            triggerSegment: 'NAD',
            children: [
              {
                nodeType: 'segment',
                tag: 'NAD',
                name: 'Name and address',
                mandatory: true,
                maxOccurrences: 1,
                position: 110,
                elements: [],
                mapping: {
                  targetField: 'partyId',
                  elementIndex: 1,
                },
              },
              {
                nodeType: 'segment',
                tag: 'CTA',
                name: 'Contact information',
                mandatory: false,
                maxOccurrences: 1,
                position: 120,
                elements: [],
                mapping: {
                  targetField: 'contactName',
                  elementIndex: 1,
                },
              },
            ],
            mapping: {
              targetField: 'party',
              elementIndex: 0,  // Not used for groups
            },
          },
        ],
      };

      // Act
      const result = mapper.map<{ party: { partyId: string; contactName: string } }>(
        ediMessage,
        structure
      );

      // Assert
      expect(result.party).toBeDefined();
      expect(result.party.partyId).toBe('1234567890');
      expect(result.party.contactName).toBe('John Doe');
    });

    it('should map multiple segment groups to array of nested objects', () => {
      const ediMessage = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      // First party group
      const nad1 = new EDISegment('NAD', [
        new EDIElement('SU', []),
        new EDIElement('1234567890', []),
      ]);
      ediMessage.addSegment(nad1);

      const cta1 = new EDISegment('CTA', [
        new EDIElement('PD', []),
        new EDIElement('John Doe', []),
      ]);
      ediMessage.addSegment(cta1);

      // Second party group
      const nad2 = new EDISegment('NAD', [
        new EDIElement('BY', []),
        new EDIElement('0987654321', []),
      ]);
      ediMessage.addSegment(nad2);

      const cta2 = new EDISegment('CTA', [
        new EDIElement('PD', []),
        new EDIElement('Jane Smith', []),
      ]);
      ediMessage.addSegment(cta2);

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG2',
            name: 'Name and Address Group',
            mandatory: false,
            maxOccurrences: 99,
            position: 100,
            triggerSegment: 'NAD',
            children: [
              {
                nodeType: 'segment',
                tag: 'NAD',
                name: 'Name and address',
                mandatory: true,
                maxOccurrences: 1,
                position: 110,
                elements: [],
                mapping: {
                  targetField: 'partyId',
                  elementIndex: 1,
                },
              },
              {
                nodeType: 'segment',
                tag: 'CTA',
                name: 'Contact information',
                mandatory: false,
                maxOccurrences: 1,
                position: 120,
                elements: [],
                mapping: {
                  targetField: 'contactName',
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

      // Act
      type Party = { partyId: string; contactName: string };
      const result = mapper.map<{ parties: Party[] }>(ediMessage, structure);

      // Assert
      expect(result.parties).toBeInstanceOf(Array);
      expect(result.parties).toHaveLength(2);
      expect(result.parties[0]!.partyId).toBe('1234567890');
      expect(result.parties[0]!.contactName).toBe('John Doe');
      expect(result.parties[1]!.partyId).toBe('0987654321');
      expect(result.parties[1]!.contactName).toBe('Jane Smith');
    });
  });
});
