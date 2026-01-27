import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationContext } from './ValidationContext';

describe('ValidationContext', () => {
  let context: ValidationContext;

  beforeEach(() => {
    context = new ValidationContext();
  });

  describe('getPath()', () => {
    it('should return simple path without groups', () => {
      const path = context.getPath('UNH');
      expect(path).toBe('UNH[0]');
    });

    it('should increment index for repeated segments', () => {
      const path1 = context.getPath('LIN');
      const path2 = context.getPath('LIN');
      const path3 = context.getPath('LIN');

      expect(path1).toBe('LIN[0]');
      expect(path2).toBe('LIN[1]');
      expect(path3).toBe('LIN[2]');
    });

    it('should return path with single group', () => {
      context.enterGroup('SG2');
      const path = context.getPath('NAD');

      expect(path).toBe('SG2.NAD[0]');
    });

    it('should return path with nested groups', () => {
      context.enterGroup('SG2');
      context.enterGroup('SG3');
      const path = context.getPath('LOC');

      expect(path).toBe('SG2.SG3.LOC[0]');
    });

    it('should track separate indices per segment tag', () => {
      context.enterGroup('SG2');
      const path1 = context.getPath('NAD');
      const path2 = context.getPath('CTA');
      const path3 = context.getPath('NAD');

      expect(path1).toBe('SG2.NAD[0]');
      expect(path2).toBe('SG2.CTA[0]');
      expect(path3).toBe('SG2.NAD[1]');
    });

    it('should handle exit group correctly', () => {
      context.enterGroup('SG2');
      context.enterGroup('SG3');
      context.exitGroup();

      const path = context.getPath('NAD');
      expect(path).toBe('SG2.NAD[0]');
    });
  });

  describe('enterGroup() / exitGroup()', () => {
    it('should allow multiple enter/exit cycles', () => {
      context.enterGroup('SG1');
      const path1 = context.getPath('NAD');
      context.exitGroup();

      context.enterGroup('SG2');
      const path2 = context.getPath('NAD');
      context.exitGroup();

      expect(path1).toBe('SG1.NAD[0]');
      expect(path2).toBe('SG2.NAD[0]');
    });
  });

  describe('reset()', () => {
    it('should reset path and segment indices', () => {
      context.enterGroup('SG2');
      context.getPath('NAD');
      context.getPath('NAD');

      context.reset();

      const path = context.getPath('NAD');
      expect(path).toBe('NAD[0]');
    });

    it('should clear group stack after reset', () => {
      context.enterGroup('SG2');
      context.enterGroup('SG3');
      context.reset();

      const path = context.getPath('NAD');
      expect(path).toBe('NAD[0]');
    });
  });
});
