// noinspection MagicNumberJS

import { describe, it, expect, beforeEach } from 'vitest';
import { StructureMappingService } from '@application';
import { EDIElement, EDISegment, MessageType, Standard, Version } from '@domain';
import { EDIMessageFactory } from '@application/factories';
import type { MessageStructureDTO, SegmentNode } from '@application/dtos';

describe('StructureMappingService', () => {
  let mapper: StructureMappingService;

  beforeEach(() => {
    mapper = new StructureMappingService();
  });

  describe('map() - EDIMessage to Business Object', () => {
    it('should map a simple segment to a simple object field', () => {
      // Arrange: Create EDIMessage with one segment
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const segment = new EDISegment('BGM', [
        new EDIElement('220', []),  // Document type
        new EDIElement('DOC123', []),  // Document number
      ]);
      ediMessage.addSegment(segment);

      // Arrange: Create MessageStructureDTO with mapping
      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

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

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const bgmSegment = new EDISegment('BGM', [
        new EDIElement('220', []),
        new EDIElement('DOC123', []),
      ]);
      ediMessage.addSegment(bgmSegment);
      // No DTM segment!

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

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

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const qtySegment = new EDISegment('QTY', [
        new EDIElement('21', []),
        new EDIElement('100', []),
      ]);
      ediMessage.addSegment(qtySegment);

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const unhSegment = new EDISegment('UNH', [
        new EDIElement('1', []),
      ]);
      ediMessage.addSegment(unhSegment);

      const bgmSegment = new EDISegment('BGM', [
        new EDIElement('220', []),
        new EDIElement('DOC123', []),
      ]);
      ediMessage.addSegment(bgmSegment);

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const dtm = new EDISegment('DTM', [
        new EDIElement('20260126', []),
      ]);
      ediMessage.addSegment(dtm);

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const dtm = new EDISegment('DTM', [
        new EDIElement('260126', []),
      ]);
      ediMessage.addSegment(dtm);

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const seg = new EDISegment('TST', [
        new EDIElement('1', []),
      ]);
      ediMessage.addSegment(seg);

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      // UNH has composite element at position 1 with components
      const compositeElement = new EDIElement('', ['ORDERS', 'D', '96A', 'UN']);

      const unhSegment = new EDISegment('UNH', [
        new EDIElement('1', []),  // Message reference (simple)
        compositeElement,         // S009 composite
      ]);
      ediMessage.addSegment(unhSegment);

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const compositeElement = new EDIElement('', ['ORDERS', 'D', '96A', 'UN']);

      const unhSegment = new EDISegment('UNH', [
        new EDIElement('1', []),
        compositeElement,
      ]);
      ediMessage.addSegment(unhSegment);

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

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

      const structure: MessageStructureDTO = {
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
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

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

      const structure: MessageStructureDTO = {
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

  describe('Error Handling', () => {
    it('should use structure-based mapping when no mapping rules defined (produces segment-keyed result)', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const segment = new EDISegment('BGM', [
        new EDIElement('DOC123', []),
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'BGM',
            name: 'Beginning of message',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            // NO mapping → structure-based path
          } as SegmentNode,
        ],
      };

      const result = mapper.map<any>(ediMessage, structure);

      // Structure-based: produces segment-keyed object (empty elements = empty object)
      expect(result['BGM']).toEqual({});
    });

    it('should handle missing element gracefully', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      // Segment with only 1 element
      const segment = new EDISegment('BGM', [
        new EDIElement('220', []),
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
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
              elementIndex: 5,  // Out of bounds!
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ documentNumber?: string }>(ediMessage, structure);

      expect(result.documentNumber).toBeUndefined();
    });

    it('should handle missing component in composite element', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      // Composite with only 2 components
      const composite = new EDIElement('', ['ORDERS', 'D']);
      const segment = new EDISegment('UNH', [
        new EDIElement('1', []),
        composite,
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
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
              targetField: 'release',
              elementIndex: 1,
              componentIndex: 5,  // Out of bounds!
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ release?: string }>(ediMessage, structure);

      expect(result.release).toBeUndefined();
    });

    it('should handle empty string values', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const segment = new EDISegment('BGM', [
        new EDIElement('', []),  // Empty string
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
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
              elementIndex: 0,
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ documentNumber: string }>(ediMessage, structure);

      expect(result.documentNumber).toBe('');
    });

    it('should handle invalid date format gracefully', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const segment = new EDISegment('DTM', [
        new EDIElement('INVALID', []),
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
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
      // Invalid date should still create a Date object (even if invalid)
    });

    it('should handle non-numeric string in number conversion', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const segment = new EDISegment('QTY', [
        new EDIElement('ABC', []),  // Non-numeric
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'QTY',
            name: 'Quantity',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'quantity',
              elementIndex: 0,
              typeConversion: 'number',
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ quantity: number }>(ediMessage, structure);

      expect(Number.isNaN(result.quantity)).toBe(true);
    });

    it('should handle empty segments array', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });
      // No segments added!

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
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
              elementIndex: 0,
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ documentNumber?: string }>(ediMessage, structure);

      expect(result.documentNumber).toBeUndefined();
    });

    it('should handle segment group with no trigger segment', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });
      // No NAD segment!

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
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
                  elementIndex: 0,
                },
              },
            ],
            mapping: {
              targetField: 'party',
              elementIndex: 0,
            },
          },
        ],
      };

      const result = mapper.map<{ party?: any }>(ediMessage, structure);

      expect(result.party).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle message with only technical segments (structure-based produces segment keys)', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const unh = new EDISegment('UNH', [new EDIElement('1', [])]);
      const unt = new EDISegment('UNT', [new EDIElement('2', [])]);
      ediMessage.addSegment(unh);
      ediMessage.addSegment(unt);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            // No mapping → structure-based
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'UNT',
            name: 'Trailer',
            mandatory: true,
            maxOccurrences: 1,
            position: 20,
            elements: [],
            // No mapping
          } as SegmentNode,
        ],
      };

      const result = mapper.map<any>(ediMessage, structure);

      // Structure-based: segments present → keyed by tag with empty element objects
      expect(result['UNH']).toEqual({});
      expect(result['UNT']).toEqual({});
    });

    it('should handle time values as strings', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const segment = new EDISegment('DTM', [
        new EDIElement('1430', []),
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'DTM',
            name: 'Time',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'time',
              elementIndex: 0,
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ time: string }>(ediMessage, structure);

      expect(result.time).toBe('1430');
    });

    it('should handle decimal numbers with type conversion', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const segment = new EDISegment('PRI', [
        new EDIElement('99.99', []),
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'PRI',
            name: 'Price',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'price',
              elementIndex: 0,
              typeConversion: 'number',
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ price: number }>(ediMessage, structure);

      expect(result.price).toBe(99.99);
      expect(typeof result.price).toBe('number');
    });

    it('should handle boolean false values', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const segment = new EDISegment('TST', [
        new EDIElement('0', []),
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
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

      expect(result.flag).toBe(false);
      expect(typeof result.flag).toBe('boolean');
    });

    it('should handle negative numbers', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const segment = new EDISegment('QTY', [
        new EDIElement('-50', []),
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'QTY',
            name: 'Quantity',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'quantity',
              elementIndex: 0,
              typeConversion: 'number',
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ quantity: number }>(ediMessage, structure);

      expect(result.quantity).toBe(-50);
    });

    it('should handle zero as valid number', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const segment = new EDISegment('QTY', [
        new EDIElement('0', []),
      ]);
      ediMessage.addSegment(segment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'QTY',
            name: 'Quantity',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'quantity',
              elementIndex: 0,
              typeConversion: 'number',
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ quantity: number }>(ediMessage, structure);

      expect(result.quantity).toBe(0);
    });

    it('should handle multiple occurrences with maxOccurrences = 1 (take first)', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      // Add multiple BGM segments (violates spec but test mapper behavior)
      const bgm1 = new EDISegment('BGM', [new EDIElement('DOC1', [])]);
      const bgm2 = new EDISegment('BGM', [new EDIElement('DOC2', [])]);
      ediMessage.addSegment(bgm1);
      ediMessage.addSegment(bgm2);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
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
              elementIndex: 0,
              isArray: false,  // Single value
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.map<{ documentNumber: string }>(ediMessage, structure);

      // Should take first occurrence
      expect(result.documentNumber).toBe('DOC1');
    });

    it('should handle deeply nested segment groups', () => {
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const nad = new EDISegment('NAD', [new EDIElement('SU', [])]);
      const cta = new EDISegment('CTA', [new EDIElement('John', [])]);
      const com = new EDISegment('COM', [new EDIElement('john@example.com', [])]);
      ediMessage.addSegment(nad);
      ediMessage.addSegment(cta);
      ediMessage.addSegment(com);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG2',
            name: 'Party Group',
            mandatory: false,
            maxOccurrences: 1,
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
                  targetField: 'partyRole',
                  elementIndex: 0,
                },
              },
              {
                nodeType: 'segmentGroup',
                id: 'SG3',
                name: 'Contact Group',
                mandatory: false,
                maxOccurrences: 1,
                position: 120,
                triggerSegment: 'CTA',
                children: [
                  {
                    nodeType: 'segment',
                    tag: 'CTA',
                    name: 'Contact',
                    mandatory: true,
                    maxOccurrences: 1,
                    position: 130,
                    elements: [],
                    mapping: {
                      targetField: 'contactName',
                      elementIndex: 0,
                    },
                  },
                  {
                    nodeType: 'segment',
                    tag: 'COM',
                    name: 'Communication',
                    mandatory: false,
                    maxOccurrences: 1,
                    position: 140,
                    elements: [],
                    mapping: {
                      targetField: 'email',
                      elementIndex: 0,
                    },
                  },
                ],
                mapping: {
                  targetField: 'contact',
                  elementIndex: 0,
                },
              },
            ],
            mapping: {
              targetField: 'party',
              elementIndex: 0,
            },
          },
        ],
      };

      type Contact = { contactName: string; email: string };
      type Party = { partyRole: string; contact: Contact };
      const result = mapper.map<{ party: Party }>(ediMessage, structure);

      expect(result.party).toBeDefined();
      expect(result.party.partyRole).toBe('SU');
      expect(result.party.contact).toBeDefined();
      expect(result.party.contact.contactName).toBe('John');
      expect(result.party.contact.email).toBe('john@example.com');
    });
  });

  describe('unmap() - Business Object to EDIMessage', () => {
    it('should unmap simple business object to EDI segments', () => {
      const businessObject = {
        documentNumber: 'DOC123',
      };

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
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
          } as SegmentNode,
        ],
      };

      const result = mapper.unmap(businessObject, structure);

      expect(result).toBeDefined();
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]!.tag).toBe('BGM');
      expect(result.segments[0]!.elements[1]!.value).toBe('DOC123');
    });

    it('should unmap date fields with proper formatting', () => {
      const businessObject = {
        documentDate: new Date('2026-01-26'),
      };

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
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
              targetField: 'documentDate',
              elementIndex: 0,
              typeConversion: 'date',
              dateFormat: 'YYYYMMDD',
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.unmap(businessObject, structure);

      expect(result.segments[0]!.elements[0]!.value).toBe('20260126');
    });

    it('should unmap array to multiple segments', () => {
      const businessObject = {
        parties: ['1234567890', '0987654321'],
      };

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'NAD',
            name: 'Party',
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

      const result = mapper.unmap(businessObject, structure);

      expect(result.segments).toHaveLength(2);
      expect(result.segments[0]!.tag).toBe('NAD');
      expect(result.segments[0]!.elements[1]!.value).toBe('1234567890');
      expect(result.segments[1]!.elements[1]!.value).toBe('0987654321');
    });

    it('should unmap number fields', () => {
      const businessObject = {
        quantity: 100,
      };

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'QTY',
            name: 'Quantity',
            mandatory: true,
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

      const result = mapper.unmap(businessObject, structure);

      expect(result.segments[0]!.elements[1]!.value).toBe('100');
    });

    it('should unmap boolean fields', () => {
      const businessObject = {
        flag: true,
      };

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
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

      const result = mapper.unmap(businessObject, structure);

      expect(result.segments[0]!.elements[0]!.value).toBe('1');
    });

    it('should skip undefined fields', () => {
      const businessObject = {
        documentNumber: 'DOC123',
        // optionalField is undefined
      };

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
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
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'DTM',
            name: 'Date',
            mandatory: false,
            maxOccurrences: 1,
            position: 20,
            elements: [],
            mapping: {
              targetField: 'optionalField',
              elementIndex: 0,
            },
          } as SegmentNode,
        ],
      };

      const result = mapper.unmap(businessObject, structure);

      expect(result.segments).toHaveLength(1); // Only BGM, no DTM
      expect(result.segments[0]!.tag).toBe('BGM');
    });

    it('should handle roundtrip: map → unmap', () => {
      // Start with EDI message
      const ediMessage = EDIMessageFactory.create({ standard: Standard.EDIFACT, version: new Version(Standard.EDIFACT, 'D.20B'), messageType: new MessageType(Standard.EDIFACT, 'ORDERS') });

      const bgmSegment = new EDISegment('BGM', [
        new EDIElement('220', []),
        new EDIElement('DOC123', []),
      ]);
      ediMessage.addSegment(bgmSegment);

      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
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
          } as SegmentNode,
        ],
      };

      // Map to business object
      const businessObject = mapper.map<{ documentNumber: string }>(ediMessage, structure);

      // Unmap back to EDI
      const result = mapper.unmap(businessObject, structure);

      expect(result.segments[0]!.tag).toBe('BGM');
      expect(result.segments[0]!.elements[1]!.value).toBe('DOC123');
    });
  });

  // ============================================================================
  // Structure-based mapping (no mapping rules required)
  // ============================================================================

  describe('Structure-based mapping (no mapping rules)', () => {
    const makeMessage = () => EDIMessageFactory.create({
      standard: Standard.EDIFACT,
      version: new Version(Standard.EDIFACT, 'D.20B'),
      messageType: new MessageType(Standard.EDIFACT, 'ORDERS')
    });

    describe('map() - flat segments', () => {
      it('should map a single segment using element codes as keys', () => {
        const msg = makeMessage();
        msg.addSegment(new EDISegment('BGM', [
          new EDIElement('220'),
          new EDIElement('PO-2026-001'),
          new EDIElement('9'),
        ]));

        const structure: MessageStructureDTO = {
          standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'ORDERS',
          structure: [{
            nodeType: 'segment', tag: 'BGM', name: 'Beginning of message',
            mandatory: true, maxOccurrences: 1, position: 10,
            elements: [
              { nodeType: 'element', code: '1001', name: 'Doc type',   mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
              { nodeType: 'element', code: '1004', name: 'Doc number', mandatory: false, position: 2, dataType: 'an', maxLength: 35 },
              { nodeType: 'element', code: '1225', name: 'Msg func',   mandatory: false, position: 3, dataType: 'an', maxLength: 3 },
            ]
          }]
        };

        const result = mapper.map<Record<string, unknown>>(msg, structure);

        expect(result['BGM']).toEqual({ '1001': '220', '1004': 'PO-2026-001', '1225': '9' });
      });

      it('should map composite element to nested object keyed by component codes', () => {
        const msg = makeMessage();
        msg.addSegment(new EDISegment('DTM', [
          new EDIElement('', ['137', '20260127', '102']),
        ]));

        const structure: MessageStructureDTO = {
          standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'ORDERS',
          structure: [{
            nodeType: 'segment', tag: 'DTM', name: 'Date/Time',
            mandatory: true, maxOccurrences: 1, position: 20,
            elements: [{
              nodeType: 'composite', code: 'C507', name: 'DTM composite',
              mandatory: true, position: 1,
              components: [
                { nodeType: 'element', code: '2005', name: 'Qualifier', mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
                { nodeType: 'element', code: '2380', name: 'Value',     mandatory: false, position: 2, dataType: 'an', maxLength: 35 },
                { nodeType: 'element', code: '2379', name: 'Format',    mandatory: false, position: 3, dataType: 'an', maxLength: 3 },
              ]
            }]
          }]
        };

        const result = mapper.map<Record<string, unknown>>(msg, structure);

        expect(result['DTM']).toEqual({ C507: { '2005': '137', '2380': '20260127', '2379': '102' } });
      });

      it('should map repeating segment (maxOccurrences > 1) to array', () => {
        const msg = makeMessage();
        msg.addSegment(new EDISegment('DTM', [new EDIElement('', ['137', '20260127', '102'])]));
        msg.addSegment(new EDISegment('DTM', [new EDIElement('', ['2', '20260201', '102'])]));

        const structure: MessageStructureDTO = {
          standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'ORDERS',
          structure: [{
            nodeType: 'segment', tag: 'DTM', name: 'Date/Time',
            mandatory: false, maxOccurrences: 35, position: 20,
            elements: [{
              nodeType: 'composite', code: 'C507', name: 'DTM composite',
              mandatory: true, position: 1,
              components: [
                { nodeType: 'element', code: '2005', name: 'Qualifier', mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
                { nodeType: 'element', code: '2380', name: 'Value',     mandatory: false, position: 2, dataType: 'an', maxLength: 35 },
                { nodeType: 'element', code: '2379', name: 'Format',    mandatory: false, position: 3, dataType: 'an', maxLength: 3 },
              ]
            }]
          }]
        };

        const result = mapper.map<Record<string, unknown>>(msg, structure);

        expect(Array.isArray(result['DTM'])).toBe(true);
        expect((result['DTM'] as any[])[0]).toEqual({ C507: { '2005': '137', '2380': '20260127', '2379': '102' } });
        expect((result['DTM'] as any[])[1]).toEqual({ C507: { '2005': '2',   '2380': '20260201', '2379': '102' } });
      });
    });

    describe('map() - segment groups', () => {
      it('should map segment group instances by trigger segment', () => {
        const msg = makeMessage();
        // Group instance 1: RFF+ON:REF-001, DTM
        msg.addSegment(new EDISegment('RFF', [new EDIElement('', ['ON', 'REF-001'])]));
        msg.addSegment(new EDISegment('DTM', [new EDIElement('', ['171', '20260127', '102'])]));
        // Group instance 2: RFF+DQ:REF-002
        msg.addSegment(new EDISegment('RFF', [new EDIElement('', ['DQ', 'REF-002'])]));

        const structure: MessageStructureDTO = {
          standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'ORDERS',
          structure: [{
            nodeType: 'segmentGroup', id: 'SG1', name: 'References',
            mandatory: false, maxOccurrences: 99, position: 30,
            triggerSegment: 'RFF',
            children: [
              {
                nodeType: 'segment', tag: 'RFF', name: 'Reference',
                mandatory: true, maxOccurrences: 1, position: 10,
                elements: [{
                  nodeType: 'composite', code: 'C506', name: 'Reference composite',
                  mandatory: true, position: 1,
                  components: [
                    { nodeType: 'element', code: '1153', name: 'Qualifier', mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
                    { nodeType: 'element', code: '1154', name: 'Value',     mandatory: false, position: 2, dataType: 'an', maxLength: 70 },
                  ]
                }]
              },
              {
                nodeType: 'segment', tag: 'DTM', name: 'Date',
                mandatory: false, maxOccurrences: 5, position: 20,
                elements: [{
                  nodeType: 'composite', code: 'C507', name: 'DTM composite',
                  mandatory: true, position: 1,
                  components: [
                    { nodeType: 'element', code: '2005', name: 'Qualifier', mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
                    { nodeType: 'element', code: '2380', name: 'Value',     mandatory: false, position: 2, dataType: 'an', maxLength: 35 },
                    { nodeType: 'element', code: '2379', name: 'Format',    mandatory: false, position: 3, dataType: 'an', maxLength: 3 },
                  ]
                }]
              }
            ]
          }]
        };

        const result = mapper.map<Record<string, unknown>>(msg, structure);

        const sg1 = result['SG1'] as any[];
        expect(Array.isArray(sg1)).toBe(true);
        expect(sg1).toHaveLength(2);
        expect(sg1[0]!['RFF']).toEqual({ C506: { '1153': 'ON', '1154': 'REF-001' } });
        expect(sg1[0]!['DTM']).toEqual({ C507: { '2005': '171', '2380': '20260127', '2379': '102' } });
        expect(sg1[1]!['RFF']).toEqual({ C506: { '1153': 'DQ', '1154': 'REF-002' } });
        expect(sg1[1]!['DTM']).toBeUndefined();
      });

      it('should map mixed top-level segments and segment groups', () => {
        const msg = makeMessage();
        msg.addSegment(new EDISegment('BGM', [new EDIElement('220'), new EDIElement('PO-001')]));
        msg.addSegment(new EDISegment('RFF', [new EDIElement('', ['ON', 'REF-001'])]));

        const structure: MessageStructureDTO = {
          standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'ORDERS',
          structure: [
            {
              nodeType: 'segment', tag: 'BGM', name: 'BGM',
              mandatory: true, maxOccurrences: 1, position: 10,
              elements: [
                { nodeType: 'element', code: '1001', name: 'Type',   mandatory: true, position: 1, dataType: 'an', maxLength: 3 },
                { nodeType: 'element', code: '1004', name: 'Number', mandatory: true, position: 2, dataType: 'an', maxLength: 35 },
              ]
            },
            {
              nodeType: 'segmentGroup', id: 'SG1', name: 'Refs',
              mandatory: false, maxOccurrences: 99, position: 30,
              triggerSegment: 'RFF',
              children: [{
                nodeType: 'segment', tag: 'RFF', name: 'Reference',
                mandatory: true, maxOccurrences: 1, position: 10,
                elements: [{
                  nodeType: 'composite', code: 'C506', name: 'Ref',
                  mandatory: true, position: 1,
                  components: [
                    { nodeType: 'element', code: '1153', name: 'Q', mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
                    { nodeType: 'element', code: '1154', name: 'V', mandatory: false, position: 2, dataType: 'an', maxLength: 70 },
                  ]
                }]
              }]
            }
          ]
        };

        const result = mapper.map<Record<string, unknown>>(msg, structure);

        expect(result['BGM']).toEqual({ '1001': '220', '1004': 'PO-001' });
        expect((result['SG1'] as any[])[0]!['RFF']).toEqual({ C506: { '1153': 'ON', '1154': 'REF-001' } });
      });
    });

    describe('unmap() - roundtrip', () => {
      it('should roundtrip flat segment: map then unmap produces same EDI values', () => {
        const msg = makeMessage();
        msg.addSegment(new EDISegment('BGM', [
          new EDIElement('220'),
          new EDIElement('PO-2026-001'),
          new EDIElement('9'),
        ]));

        const structure: MessageStructureDTO = {
          standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'ORDERS',
          structure: [{
            nodeType: 'segment', tag: 'BGM', name: 'BGM',
            mandatory: true, maxOccurrences: 1, position: 10,
            elements: [
              { nodeType: 'element', code: '1001', name: 'Type',   mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
              { nodeType: 'element', code: '1004', name: 'Number', mandatory: false, position: 2, dataType: 'an', maxLength: 35 },
              { nodeType: 'element', code: '1225', name: 'Func',   mandatory: false, position: 3, dataType: 'an', maxLength: 3 },
            ]
          }]
        };

        const mapped = mapper.map<Record<string, unknown>>(msg, structure);
        const rebuilt = mapper.unmap(mapped, structure);

        const bgm = rebuilt.segments.find(s => s.tag === 'BGM')!;
        expect(bgm).toBeDefined();
        expect(bgm.elements[0]!.value).toBe('220');
        expect(bgm.elements[1]!.value).toBe('PO-2026-001');
        expect(bgm.elements[2]!.value).toBe('9');
      });

      it('should roundtrip composite element', () => {
        const msg = makeMessage();
        msg.addSegment(new EDISegment('DTM', [
          new EDIElement('', ['137', '20260127', '102']),
        ]));

        const structure: MessageStructureDTO = {
          standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'ORDERS',
          structure: [{
            nodeType: 'segment', tag: 'DTM', name: 'DTM',
            mandatory: true, maxOccurrences: 1, position: 20,
            elements: [{
              nodeType: 'composite', code: 'C507', name: 'DTM composite',
              mandatory: true, position: 1,
              components: [
                { nodeType: 'element', code: '2005', name: 'Q', mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
                { nodeType: 'element', code: '2380', name: 'V', mandatory: false, position: 2, dataType: 'an', maxLength: 35 },
                { nodeType: 'element', code: '2379', name: 'F', mandatory: false, position: 3, dataType: 'an', maxLength: 3 },
              ]
            }]
          }]
        };

        const mapped = mapper.map<Record<string, unknown>>(msg, structure);
        const rebuilt = mapper.unmap(mapped, structure);

        const dtm = rebuilt.segments.find(s => s.tag === 'DTM')!;
        expect(dtm).toBeDefined();
        expect(dtm.elements[0]!.isComposite()).toBe(true);
        expect(dtm.elements[0]!.components[0]).toBe('137');
        expect(dtm.elements[0]!.components[1]).toBe('20260127');
        expect(dtm.elements[0]!.components[2]).toBe('102');
      });

      it('should unmap structure-based object directly (without prior map())', () => {
        const sourceObj = {
          BGM: { '1001': '220', '1004': 'PO-DIRECT-001', '1225': '9' }
        };

        const structure: MessageStructureDTO = {
          standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'ORDERS',
          structure: [{
            nodeType: 'segment', tag: 'BGM', name: 'BGM',
            mandatory: true, maxOccurrences: 1, position: 10,
            elements: [
              { nodeType: 'element', code: '1001', name: 'Type',   mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
              { nodeType: 'element', code: '1004', name: 'Number', mandatory: false, position: 2, dataType: 'an', maxLength: 35 },
              { nodeType: 'element', code: '1225', name: 'Func',   mandatory: false, position: 3, dataType: 'an', maxLength: 3 },
            ]
          }]
        };

        const rebuilt = mapper.unmap(sourceObj, structure);

        const bgm = rebuilt.segments.find(s => s.tag === 'BGM')!;
        expect(bgm.elements[0]!.value).toBe('220');
        expect(bgm.elements[1]!.value).toBe('PO-DIRECT-001');
        expect(bgm.elements[2]!.value).toBe('9');
      });

      it('should unmap segment group array to flat EDI segments in order', () => {
        const sourceObj = {
          SG1: [
            { RFF: { C506: { '1153': 'ON', '1154': 'REF-001' } } },
            { RFF: { C506: { '1153': 'DQ', '1154': 'REF-002' } } },
          ]
        };

        const structure: MessageStructureDTO = {
          standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'ORDERS',
          structure: [{
            nodeType: 'segmentGroup', id: 'SG1', name: 'Refs',
            mandatory: false, maxOccurrences: 99, position: 30,
            triggerSegment: 'RFF',
            children: [{
              nodeType: 'segment', tag: 'RFF', name: 'Reference',
              mandatory: true, maxOccurrences: 1, position: 10,
              elements: [{
                nodeType: 'composite', code: 'C506', name: 'Ref',
                mandatory: true, position: 1,
                components: [
                  { nodeType: 'element', code: '1153', name: 'Q', mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
                  { nodeType: 'element', code: '1154', name: 'V', mandatory: false, position: 2, dataType: 'an', maxLength: 70 },
                ]
              }]
            }]
          }]
        };

        const rebuilt = mapper.unmap(sourceObj, structure);

        const rff = rebuilt.segments.filter(s => s.tag === 'RFF');
        expect(rff).toHaveLength(2);
        expect(rff[0]!.elements[0]!.components[0]).toBe('ON');
        expect(rff[0]!.elements[0]!.components[1]).toBe('REF-001');
        expect(rff[1]!.elements[0]!.components[0]).toBe('DQ');
        expect(rff[1]!.elements[0]!.components[1]).toBe('REF-002');
      });
    });
  });

  // ============================================================================
  // MappingKeyStrategy — output key format
  // ============================================================================

  describe('MappingKeyStrategy', () => {
    const bgmStructure: MessageStructureDTO = {
      standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'ORDERS',
      structure: [{
        nodeType: 'segment', tag: 'BGM', name: 'Beginning of message',
        mandatory: true, maxOccurrences: 1, position: 10,
        elements: [
          { nodeType: 'element', code: '1001', name: 'Document type code', mandatory: true,  position: 1, dataType: 'an', maxLength: 3 },
          { nodeType: 'element', code: '1004', name: 'Document identifier', mandatory: false, position: 2, dataType: 'an', maxLength: 35 },
        ]
      }]
    };

    const makeMsg = () => {
      const msg = EDIMessageFactory.create({
        standard: Standard.EDIFACT,
        version: new Version(Standard.EDIFACT, 'D.20B'),
        messageType: new MessageType(Standard.EDIFACT, 'ORDERS')
      });
      msg.addSegment(new EDISegment('BGM', [new EDIElement('220'), new EDIElement('PO-001')]));
      return msg;
    };

    it('strategy "code" (default) uses segment tag and element codes as keys', () => {
      const result = mapper.map<Record<string, unknown>>(makeMsg(), bgmStructure);
      expect(result['BGM']).toBeDefined();
      expect((result['BGM'] as any)['1001']).toBe('220');
      expect((result['BGM'] as any)['1004']).toBe('PO-001');
    });

    it('strategy "name" uses human-readable names as keys', () => {
      const result = mapper.map<Record<string, unknown>>(makeMsg(), bgmStructure, 'name');
      expect(result['Beginning of message']).toBeDefined();
      expect((result['Beginning of message'] as any)['Document type code']).toBe('220');
      expect((result['Beginning of message'] as any)['Document identifier']).toBe('PO-001');
    });

    it('strategy "camelCase" uses camelCase names as keys', () => {
      const result = mapper.map<Record<string, unknown>>(makeMsg(), bgmStructure, 'camelCase');
      expect(result['beginningOfMessage']).toBeDefined();
      expect((result['beginningOfMessage'] as any)['documentTypeCode']).toBe('220');
      expect((result['beginningOfMessage'] as any)['documentIdentifier']).toBe('PO-001');
    });

    it('strategy "snake_case" uses snake_case names as keys', () => {
      const result = mapper.map<Record<string, unknown>>(makeMsg(), bgmStructure, 'snake_case');
      expect(result['beginning_of_message']).toBeDefined();
      expect((result['beginning_of_message'] as any)['document_type_code']).toBe('220');
      expect((result['beginning_of_message'] as any)['document_identifier']).toBe('PO-001');
    });

    it('strategy "kebab-case" uses kebab-case names as keys', () => {
      const result = mapper.map<Record<string, unknown>>(makeMsg(), bgmStructure, 'kebab-case');
      expect(result['beginning-of-message']).toBeDefined();
      expect((result['beginning-of-message'] as any)['document-type-code']).toBe('220');
      expect((result['beginning-of-message'] as any)['document-identifier']).toBe('PO-001');
    });

    it('roundtrip camelCase: map then unmap restores original EDI values', () => {
      const mapped = mapper.map<Record<string, unknown>>(makeMsg(), bgmStructure, 'camelCase');
      const rebuilt = mapper.unmap(mapped, bgmStructure, 'camelCase');

      const bgm = rebuilt.segments.find(s => s.tag === 'BGM')!;
      expect(bgm.elements[0]!.value).toBe('220');
      expect(bgm.elements[1]!.value).toBe('PO-001');
    });

    it('roundtrip snake_case: map then unmap restores original EDI values', () => {
      const mapped = mapper.map<Record<string, unknown>>(makeMsg(), bgmStructure, 'snake_case');
      const rebuilt = mapper.unmap(mapped, bgmStructure, 'snake_case');

      const bgm = rebuilt.segments.find(s => s.tag === 'BGM')!;
      expect(bgm.elements[0]!.value).toBe('220');
      expect(bgm.elements[1]!.value).toBe('PO-001');
    });

    it('unmap() with camelCase input directly (without prior map())', () => {
      const camelObj = {
        beginningOfMessage: {
          documentTypeCode: '220',
          documentIdentifier: 'DIRECT-001'
        }
      };
      const rebuilt = mapper.unmap(camelObj, bgmStructure, 'camelCase');

      const bgm = rebuilt.segments.find(s => s.tag === 'BGM')!;
      expect(bgm.elements[0]!.value).toBe('220');
      expect(bgm.elements[1]!.value).toBe('DIRECT-001');
    });
  });
});
