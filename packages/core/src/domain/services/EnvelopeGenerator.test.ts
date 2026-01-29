import { describe, it, expect } from 'vitest';
import { EnvelopeGenerator } from './EnvelopeGenerator';

describe('EnvelopeGenerator - Domain Service', () => {
  const createGenerator = () => new EnvelopeGenerator();

  describe('generateUNH - Message Header', () => {
    it('should generate UNH segment with message type ORDERS and version D.96A', () => {
      const generator = createGenerator();

      const unh = generator.generateUNH('ORDERS', 'D.96A', '1');

      expect(unh.tag).toBe('UNH');
      expect(unh.elements).toHaveLength(2);
      expect(unh.elements[0]?.value).toBe('1');
      expect(unh.elements[1]?.components).toHaveLength(4);
      expect(unh.elements[1]?.components[0]).toBe('ORDERS');
      expect(unh.elements[1]?.components[1]).toBe('D');
      expect(unh.elements[1]?.components[2]).toBe('96A');
      expect(unh.elements[1]?.components[3]).toBe('UN');
    });

    it('should generate UNH segment with message type DESADV and version D.20B', () => {
      const generator = createGenerator();

      const unh = generator.generateUNH('DESADV', 'D.20B', '2');

      expect(unh.tag).toBe('UNH');
      expect(unh.elements[0]?.value).toBe('2');
      expect(unh.elements[1]?.components[0]).toBe('DESADV');
      expect(unh.elements[1]?.components[2]).toBe('20B');
    });

    it('should generate UNH segment with message type INVOIC and version D.01B', () => {
      const generator = createGenerator();

      const unh = generator.generateUNH('INVOIC', 'D.01B', '999');

      expect(unh.tag).toBe('UNH');
      expect(unh.elements[0]?.value).toBe('999');
      expect(unh.elements[1]?.components[0]).toBe('INVOIC');
      expect(unh.elements[1]?.components[2]).toBe('01B');
    });

    it('should work with any message type (IFTMIN, PRICAT, etc.)', () => {
      const generator = createGenerator();

      const iftmin = generator.generateUNH('IFTMIN', 'D.01B', '5');
      const pricat = generator.generateUNH('PRICAT', 'D.96A', '10');
      const recadv = generator.generateUNH('RECADV', 'D.20B', '15');

      expect(iftmin.elements[1]?.components[0]).toBe('IFTMIN');
      expect(pricat.elements[1]?.components[0]).toBe('PRICAT');
      expect(recadv.elements[1]?.components[0]).toBe('RECADV');
    });
  });

  describe('generateUNT - Message Trailer', () => {
    it('should generate UNT segment with segment count and message reference', () => {
      const generator = createGenerator();

      const unt = generator.generateUNT(15, '1');

      expect(unt.tag).toBe('UNT');
      expect(unt.elements).toHaveLength(2);
      expect(unt.elements[0]?.value).toBe('15');
      expect(unt.elements[1]?.value).toBe('1');
    });

    it('should generate UNT segment with different segment count', () => {
      const generator = createGenerator();

      const unt = generator.generateUNT(42, '999');

      expect(unt.tag).toBe('UNT');
      expect(unt.elements[0]?.value).toBe('42');
      expect(unt.elements[1]?.value).toBe('999');
    });

    it('should handle large segment counts', () => {
      const generator = createGenerator();

      const unt = generator.generateUNT(1000, '1');

      expect(unt.elements[0]?.value).toBe('1000');
    });
  });

  describe('generateUNB - Interchange Header', () => {
    it('should generate UNB segment with sender, receiver, and datetime', () => {
      const generator = createGenerator();
      const dateTime = new Date('2021-01-24T12:00:00Z');

      const unb = generator.generateUNB('SENDER123', 'RECEIVER456', dateTime, 'REF001');

      expect(unb.tag).toBe('UNB');
      expect(unb.elements).toHaveLength(5);

      expect(unb.elements[0]?.components[0]).toBe('UNOC');
      expect(unb.elements[0]?.components[1]).toBe('3');

      expect(unb.elements[1]?.components[0]).toBe('SENDER123');
      expect(unb.elements[1]?.components[1]).toBe('ZZ');

      expect(unb.elements[2]?.components[0]).toBe('RECEIVER456');
      expect(unb.elements[2]?.components[1]).toBe('ZZ');

      expect(unb.elements[3]?.components[0]).toBe('210124');
      expect(unb.elements[3]?.components[1]).toBe('1200');

      expect(unb.elements[4]?.value).toBe('REF001');
    });

    it('should format datetime correctly for different dates', () => {
      const generator = createGenerator();
      const dateTime = new Date('2024-12-31T23:59:00Z');

      const unb = generator.generateUNB('SENDER', 'RECEIVER', dateTime, 'REF002');

      expect(unb.elements[3]?.components[0]).toBe('241231');
      expect(unb.elements[3]?.components[1]).toBe('2359');
    });

    it('should work with different sender/receiver combinations', () => {
      const generator = createGenerator();
      const dateTime = new Date('2021-01-01T00:00:00Z');

      const unbCompanyA = generator.generateUNB('COMPANY_A', 'COMPANY_B', dateTime, 'ABC123');
      const unbRetailer = generator.generateUNB('RETAILER', 'SUPPLIER', dateTime, 'XYZ789');

      expect(unbCompanyA.elements[1]?.components[0]).toBe('COMPANY_A');
      expect(unbCompanyA.elements[2]?.components[0]).toBe('COMPANY_B');
      expect(unbRetailer.elements[1]?.components[0]).toBe('RETAILER');
      expect(unbRetailer.elements[2]?.components[0]).toBe('SUPPLIER');
    });
  });

  describe('generateUNZ - Interchange Trailer', () => {
    it('should generate UNZ segment with message count and control reference', () => {
      const generator = createGenerator();

      const unz = generator.generateUNZ(1, 'REF001');

      expect(unz.tag).toBe('UNZ');
      expect(unz.elements).toHaveLength(2);
      expect(unz.elements[0]?.value).toBe('1');
      expect(unz.elements[1]?.value).toBe('REF001');
    });

    it('should generate UNZ segment with multiple messages', () => {
      const generator = createGenerator();

      const unz = generator.generateUNZ(5, 'REF999');

      expect(unz.tag).toBe('UNZ');
      expect(unz.elements[0]?.value).toBe('5');
      expect(unz.elements[1]?.value).toBe('REF999');
    });

    it('should handle single message interchange', () => {
      const generator = createGenerator();

      const unz = generator.generateUNZ(1, 'CONTROL123');

      expect(unz.elements[0]?.value).toBe('1');
      expect(unz.elements[1]?.value).toBe('CONTROL123');
    });
  });

  describe('Complete Envelope Generation', () => {
    it('should generate complete envelope for any message type', () => {
      const generator = createGenerator();
      const dateTime = new Date('2021-01-24T12:00:00Z');

      const unb = generator.generateUNB('SENDER', 'RECEIVER', dateTime, 'REF001');
      const unh = generator.generateUNH('ORDERS', 'D.96A', '1');
      const unt = generator.generateUNT(10, '1');
      const unz = generator.generateUNZ(1, 'REF001');

      expect(unb.tag).toBe('UNB');
      expect(unh.tag).toBe('UNH');
      expect(unt.tag).toBe('UNT');
      expect(unz.tag).toBe('UNZ');

      expect(unh.elements[0]?.value).toBe('1');
      expect(unt.elements[1]?.value).toBe('1');

      expect(unb.elements[3]?.components[0]).toBe('210124');
      expect(unz.elements[1]?.value).toBe('REF001');
    });
  });
});
