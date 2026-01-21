import { describe, it, expect } from 'vitest';
import { EDIMessage } from './EDIMessage';
import { Standard } from '../value-objects/Standard';
import { Version } from '../value-objects/Version';
import { MessageType } from '../value-objects/MessageType';
import { EDISegment } from './EDISegment';
import { EDIElement } from './EDIElement';

describe('EDIMessage', () => {
  describe('constructor', () => {
    it('should create an EDIMessage with required properties', () => {
      // Arrange
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.20B');
      const messageType = new MessageType(Standard.EDIFACT, 'DESADV');

      // Act
      const message = new EDIMessage(standard, version, messageType);

      // Assert
      expect(message.standard).toBe(standard);
      expect(message.version).toBe(version);
      expect(message.messageType).toBe(messageType);
      expect(message.segments).toHaveLength(0);
    });

    it('should initialize with empty segments array', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      // Assert
      expect(message.segments).toBeDefined();
      expect(Array.isArray(message.segments)).toBe(true);
      expect(message.segments).toHaveLength(0);
    });
  });

  describe('addSegment', () => {
    it('should add a segment to the message', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );
      const segment = new EDISegment('UNH', []);

      // Act
      message.addSegment(segment);

      // Assert
      expect(message.segments).toHaveLength(1);
      expect(message.segments[0]).toBe(segment);
    });

    it('should add multiple segments in order', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );
      const segment1 = new EDISegment('UNH', []);
      const segment2 = new EDISegment('BGM', []);
      const segment3 = new EDISegment('UNT', []);

      // Act
      message.addSegment(segment1);
      message.addSegment(segment2);
      message.addSegment(segment3);

      // Assert
      expect(message.segments).toHaveLength(3);
      expect(message.segments[0]).toBe(segment1);
      expect(message.segments[1]).toBe(segment2);
      expect(message.segments[2]).toBe(segment3);
    });
  });

  describe('getSegmentsByTag', () => {
    it('should return segments with matching tag', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );
      const nad1 = new EDISegment('NAD', []);
      const nad2 = new EDISegment('NAD', []);
      const bgm = new EDISegment('BGM', []);

      message.addSegment(nad1);
      message.addSegment(bgm);
      message.addSegment(nad2);

      // Act
      const nadSegments = message.getSegmentsByTag('NAD');

      // Assert
      expect(nadSegments).toHaveLength(2);
      expect(nadSegments[0]).toBe(nad1);
      expect(nadSegments[1]).toBe(nad2);
    });

    it('should return empty array if no segments match', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );
      message.addSegment(new EDISegment('UNH', []));

      // Act
      const segments = message.getSegmentsByTag('NAD');

      // Assert
      expect(segments).toHaveLength(0);
    });
  });

  describe('addToGroup', () => {
    it('should add a segment to a specified group', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );
      const segment = new EDISegment('NAD', []);

      // Act
      message.addToGroup('SG1', segment);

      // Assert
      const groupSegments = message.getSegmentsByGroup('SG1');
      expect(groupSegments).toHaveLength(1);
      expect(groupSegments[0]).toBe(segment);
    });

    it('should support multiple segments in one group', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      // Act
      message.addToGroup('SG1', new EDISegment('NAD', []));
      message.addToGroup('SG1', new EDISegment('CTA', []));
      message.addToGroup('SG1', new EDISegment('COM', []));

      // Assert
      const groupSegments = message.getSegmentsByGroup('SG1');
      expect(groupSegments).toHaveLength(3);
      expect(groupSegments[0]?.tag).toBe('NAD');
      expect(groupSegments[1]?.tag).toBe('CTA');
      expect(groupSegments[2]?.tag).toBe('COM');
    });

    it('should support multiple groups', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      // Act
      message.addToGroup('SG1', new EDISegment('NAD', []));
      message.addToGroup('SG2', new EDISegment('RFF', []));
      message.addToGroup('SG10', new EDISegment('LIN', []));

      // Assert
      expect(message.getSegmentsByGroup('SG1')).toHaveLength(1);
      expect(message.getSegmentsByGroup('SG2')).toHaveLength(1);
      expect(message.getSegmentsByGroup('SG10')).toHaveLength(1);
    });
  });

  describe('getSegmentsByGroup', () => {
    it('should return empty array if group does not exist', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      // Act
      const segments = message.getSegmentsByGroup('SG1');

      // Assert
      expect(segments).toHaveLength(0);
    });
  });

  describe('isValid', () => {
    it('should return true for a valid message with segments', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );
      message.addSegment(new EDISegment('UNH', []));
      message.addSegment(new EDISegment('UNT', []));

      // Act
      const isValid = message.isValid();

      // Assert
      expect(isValid).toBe(true);
    });

    it('should return false for an empty message', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      // Act
      const isValid = message.isValid();

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('getSegmentCount', () => {
    it('should return the number of segments', () => {
      // Arrange
      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      // Act & Assert
      expect(message.getSegmentCount()).toBe(0);

      message.addSegment(new EDISegment('UNH', []));
      expect(message.getSegmentCount()).toBe(1);

      message.addSegment(new EDISegment('BGM', []));
      expect(message.getSegmentCount()).toBe(2);
    });
  });
});
