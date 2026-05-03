import { describe, it, expect } from 'vitest';
import { DataPackageValidator } from './DataPackageValidator';
import type {
  MessageFile,
  SegmentDefinition,
  ElementDefinition,
  CompositeDefinition
} from './models/DataPackageModels';

describe('DataPackageValidator', () => {

  const createElements = (): Record<string, ElementDefinition> => ({
    '1001': { code: '1001', name: 'Doc name code', dataType: 'an', maxLength: 3 },
    '1004': { code: '1004', name: 'Doc identifier', dataType: 'an', maxLength: 70 },
    '1131': { code: '1131', name: 'Code list id', dataType: 'an', maxLength: 17 },
    '3055': { code: '3055', name: 'Agency code', dataType: 'an', maxLength: 3 }
  });

  const createComposites = (): Record<string, CompositeDefinition> => ({
    C002: {
      code: 'C002', name: 'DOC NAME',
      components: [
        { elementCode: '1001', mandatory: false, position: 1 },
        { elementCode: '1131', mandatory: false, position: 2 },
        { elementCode: '3055', mandatory: false, position: 3 }
      ]
    }
  });

  const createSegments = (): Record<string, SegmentDefinition> => ({
    BGM: {
      tag: 'BGM', name: 'Beginning of message',
      elements: [
        { nodeType: 'composite', compositeCode: 'C002', mandatory: false, position: 1 },
        { nodeType: 'element', elementCode: '1004', mandatory: false, position: 2 }
      ]
    },
    DTM: {
      tag: 'DTM', name: 'Date/time/period',
      elements: [
        { nodeType: 'element', elementCode: '1001', mandatory: true, position: 1 }
      ]
    }
  });

  const createValidator = () => new DataPackageValidator(
    createSegments(),
    createElements(),
    createComposites()
  );

  describe('validate', () => {

    it('should return no issues for a complete data package', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Test',
        structure: [
          { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 },
          { nodeType: 'segment', segmentRef: 'DTM', mandatory: false, maxOccurrences: 5, position: 20 }
        ]
      };

      const issues = createValidator().validate(messageFile);

      expect(issues).toHaveLength(0);
    });

    it('should report missing segment', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Test',
        structure: [
          { nodeType: 'segment', segmentRef: 'UNH', mandatory: true, maxOccurrences: 1, position: 1 }
        ]
      };

      const issues = createValidator().validate(messageFile);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        type: 'missing-segment',
        segmentTag: 'UNH'
      });
    });

    it('should report missing element inside segment', () => {
      const segments: Record<string, SegmentDefinition> = {
        TST: { tag: 'TST', name: 'Test', elements: [
          { nodeType: 'element', elementCode: '9999', mandatory: true, position: 1 }
        ]}
      };
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'TEST', name: 'Test',
        structure: [{ nodeType: 'segment', segmentRef: 'TST', mandatory: true, maxOccurrences: 1, position: 10 }]
      };

      const issues = new DataPackageValidator(segments, createElements(), createComposites()).validate(messageFile);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ type: 'missing-element', code: '9999', segmentTag: 'TST' });
    });

    it('should report missing composite inside segment', () => {
      const segments: Record<string, SegmentDefinition> = {
        TST: { tag: 'TST', name: 'Test', elements: [
          { nodeType: 'composite', compositeCode: 'C999', mandatory: true, position: 1 }
        ]}
      };
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'TEST', name: 'Test',
        structure: [{ nodeType: 'segment', segmentRef: 'TST', mandatory: true, maxOccurrences: 1, position: 10 }]
      };

      const issues = new DataPackageValidator(segments, createElements(), createComposites()).validate(messageFile);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ type: 'missing-composite', code: 'C999', segmentTag: 'TST' });
    });

    it('should report missing element inside composite', () => {
      const composites: Record<string, CompositeDefinition> = {
        C999: { code: 'C999', name: 'Test Composite', components: [
          { elementCode: '8888', mandatory: true, position: 1 }
        ]}
      };
      const segments: Record<string, SegmentDefinition> = {
        TST: { tag: 'TST', name: 'Test', elements: [
          { nodeType: 'composite', compositeCode: 'C999', mandatory: true, position: 1 }
        ]}
      };
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'TEST', name: 'Test',
        structure: [{ nodeType: 'segment', segmentRef: 'TST', mandatory: true, maxOccurrences: 1, position: 10 }]
      };

      const issues = new DataPackageValidator(segments, createElements(), composites).validate(messageFile);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ type: 'missing-element', code: '8888' });
    });

    it('should collect ALL issues at once — not stop at first', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Test',
        structure: [
          { nodeType: 'segment', segmentRef: 'UNH', mandatory: true, maxOccurrences: 1, position: 1 },
          { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 },
          { nodeType: 'segment', segmentRef: 'UNT', mandatory: true, maxOccurrences: 1, position: 99 }
        ]
      };

      const issues = createValidator().validate(messageFile);

      expect(issues.length).toBe(2);
      const missingTags = issues.map(i => i.segmentTag);
      expect(missingTags).toContain('UNH');
      expect(missingTags).toContain('UNT');
    });

    it('should validate recursively inside segment groups', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Test',
        structure: [
          { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 },
          {
            nodeType: 'segmentGroup',
            id: 'SG1', name: 'SG1', triggerSegment: 'DTM',
            mandatory: false, maxOccurrences: 5, position: 20,
            structure: [
              { nodeType: 'segment', segmentRef: 'DTM', mandatory: true, maxOccurrences: 1, position: 10 },
              { nodeType: 'segment', segmentRef: 'MISSING_DEEP', mandatory: false, maxOccurrences: 1, position: 20 }
            ]
          }
        ]
      };

      const issues = createValidator().validate(messageFile);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ type: 'missing-segment', segmentTag: 'MISSING_DEEP' });
    });

    it('should validate recursively inside nested segment groups', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Test',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG1', name: 'SG1', triggerSegment: 'BGM',
            mandatory: false, maxOccurrences: 5, position: 10,
            structure: [
              { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 },
              {
                nodeType: 'segmentGroup',
                id: 'SG2', name: 'SG2', triggerSegment: 'DTM',
                mandatory: false, maxOccurrences: 3, position: 20,
                structure: [
                  { nodeType: 'segment', segmentRef: 'DTM', mandatory: true, maxOccurrences: 1, position: 10 },
                  { nodeType: 'segment', segmentRef: 'DEEP_MISSING', mandatory: false, maxOccurrences: 1, position: 20 }
                ]
              }
            ]
          }
        ]
      };

      const issues = createValidator().validate(messageFile);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ type: 'missing-segment', segmentTag: 'DEEP_MISSING' });
    });

    it('should not report duplicate issues for repeated segment references', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Test',
        structure: [
          { nodeType: 'segment', segmentRef: 'UNH', mandatory: true, maxOccurrences: 1, position: 1 },
          { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 },
          { nodeType: 'segment', segmentRef: 'UNH', mandatory: true, maxOccurrences: 1, position: 99 }
        ]
      };

      const issues = createValidator().validate(messageFile);

      const unhIssues = issues.filter(i => i.segmentTag === 'UNH');
      expect(unhIssues).toHaveLength(1);
    });

    it('should return hasIssues = false when data package is complete', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Test',
        structure: [
          { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 }
        ]
      };

      const result = createValidator().validateWithResult(messageFile);

      expect(result.hasIssues).toBe(false);
      expect(result.issues).toHaveLength(0);
    });

    it('should return hasIssues = true when issues exist', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Test',
        structure: [
          { nodeType: 'segment', segmentRef: 'UNH', mandatory: true, maxOccurrences: 1, position: 1 }
        ]
      };

      const result = createValidator().validateWithResult(messageFile);

      expect(result.hasIssues).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });
});

