import { describe, it, expect, beforeEach } from 'vitest';
import { BuildEDIUseCase } from './BuildEDIUseCase';
import { EDIMessage, EDISegment, EDIElement } from '@domain/entities';
import { Standard } from '@domain/value-objects/Standard';
import { StructureMapper } from '@domain/mapping';

describe('BuildEDIUseCase - Envelope Support (US-8.1)', () => {
  let useCase: BuildEDIUseCase;
  let mapper: StructureMapper;

  beforeEach(() => {
    mapper = new StructureMapper();
    useCase = new BuildEDIUseCase(mapper);
  });

  describe('Envelope Generation', () => {
    it('should generate EDIFACT message with UNH/UNT envelope when includeEnvelope is true', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      message.addSegment(new EDISegment('BGM', [new EDIElement('220')]));
      message.addSegment(new EDISegment('DTM', [new EDIElement('137:20210124:102')]));

      const result = useCase.execute({
        message,
        includeEnvelope: true,
        messageType: 'ORDERS',
        version: 'D.96A',
        messageRef: '1'
      });

      if (!result.success) {
        console.error('Build failed:', result.errors);
      }

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ediString).toBeTruthy();
        expect(result.ediString).toContain('UNH');
        expect(result.ediString).toContain('UNT');
      }
    });

    it('should generate EDIFACT message with UNB/UNZ envelope when includeInterchange is true', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      message.addSegment(new EDISegment('BGM', [new EDIElement('220')]));
      message.addSegment(new EDISegment('DTM', [new EDIElement('137:20210124:102')]));

      const result = useCase.execute({
        message,
        includeEnvelope: true,
        includeInterchange: true,
        messageType: 'ORDERS',
        version: 'D.96A',
        messageRef: '1',
        sender: 'SENDER123',
        receiver: 'RECEIVER456',
        controlRef: 'REF001'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ediString).toContain("UNB+UNOC:3+SENDER123:ZZ+RECEIVER456:ZZ");
        expect(result.ediString).toContain("UNH+1+ORDERS:D:96A:UN'");
        expect(result.ediString).toContain("BGM+220'");
        expect(result.ediString).toContain("UNT+4+1'");
        expect(result.ediString).toContain("UNZ+1+REF001'");
      }
    });

    it('should auto-generate message reference if not provided', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      message.addSegment(new EDISegment('BGM', [new EDIElement('220')]));

      const result = useCase.execute({
        message,
        includeEnvelope: true,
        messageType: 'ORDERS',
        version: 'D.96A'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ediString).toMatch(/UNH\+\d+\+ORDERS:D:96A:UN'/);
      }
    });

    it('should auto-generate control reference if not provided', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      message.addSegment(new EDISegment('BGM', [new EDIElement('220')]));

      const result = useCase.execute({
        message,
        includeEnvelope: true,
        includeInterchange: true,
        messageType: 'ORDERS',
        version: 'D.96A',
        sender: 'SENDER',
        receiver: 'RECEIVER'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ediString).toMatch(/UNB\+UNOC:3\+SENDER:ZZ\+RECEIVER:ZZ/);
        expect(result.ediString).toMatch(/UNZ\+1\+\w+'$/);
      }
    });

    it('should calculate segment count correctly including UNH and UNT', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      message.addSegment(new EDISegment('BGM', [new EDIElement('220')]));
      message.addSegment(new EDISegment('DTM', [new EDIElement('137')]));
      message.addSegment(new EDISegment('NAD', [new EDIElement('BY')]));

      const result = useCase.execute({
        message,
        includeEnvelope: true,
        messageType: 'ORDERS',
        version: 'D.96A',
        messageRef: '1'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ediString).toMatch(/UNT\+5\+1'$/);
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without envelope when includeEnvelope is false', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      message.addSegment(new EDISegment('BGM', [new EDIElement('220')]));

      const result = useCase.execute({
        message,
        includeEnvelope: false
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ediString).not.toContain('UNH');
        expect(result.ediString).not.toContain('UNT');
        expect(result.ediString).toBe("BGM+220'");
      }
    });

    it('should work without envelope when includeEnvelope is undefined (default)', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      message.addSegment(new EDISegment('BGM', [new EDIElement('220')]));

      const result = useCase.execute({
        message
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ediString).not.toContain('UNH');
        expect(result.ediString).toBe("BGM+220'");
      }
    });
  });

  describe('Error Handling', () => {
    it('should return error if includeEnvelope is true but messageType is missing', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      message.addSegment(new EDISegment('BGM', [new EDIElement('220')]));

      const result = useCase.execute({
        message,
        includeEnvelope: true,
        version: 'D.96A'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.code).toBe('MISSING_ENVELOPE_CONFIG');
      }
    });

    it('should return error if includeInterchange is true but sender is missing', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.96A', 'ORDERS');
      message.addSegment(new EDISegment('BGM', [new EDIElement('220')]));

      const result = useCase.execute({
        message,
        includeEnvelope: true,
        includeInterchange: true,
        messageType: 'ORDERS',
        version: 'D.96A',
        receiver: 'RECEIVER'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.code).toBe('MISSING_INTERCHANGE_CONFIG');
      }
    });
  });

  describe('Multiple Message Types', () => {
    it('should work with DESADV message type', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.20B', 'DESADV');
      message.addSegment(new EDISegment('BGM', [new EDIElement('351')]));

      const result = useCase.execute({
        message,
        includeEnvelope: true,
        messageType: 'DESADV',
        version: 'D.20B',
        messageRef: '2'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ediString).toContain("UNH+2+DESADV:D:20B:UN'");
      }
    });

    it('should work with INVOIC message type', () => {
      const message = new EDIMessage(Standard.EDIFACT, 'D.01B', 'INVOIC');
      message.addSegment(new EDISegment('BGM', [new EDIElement('380')]));

      const result = useCase.execute({
        message,
        includeEnvelope: true,
        messageType: 'INVOIC',
        version: 'D.01B',
        messageRef: '999'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ediString).toContain("UNH+999+INVOIC:D:01B:UN'");
      }
    });
  });
});
