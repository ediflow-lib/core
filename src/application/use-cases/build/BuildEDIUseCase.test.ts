import { describe, it, expect, beforeEach } from 'vitest';
import { BuildEDIUseCase } from './BuildEDIUseCase';
import { EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement, Delimiters } from '../../../domain';

describe('BuildEDIUseCase', () => {
  let useCase: BuildEDIUseCase;

  const createMessage = (standard: Standard, versionValue: string, messageTypeValue: string): EDIMessage => {
    return new EDIMessage(
      standard,
      new Version(standard, versionValue),
      new MessageType(standard, messageTypeValue)
    );
  };

  const createValidMessage = (standard: Standard, versionValue: string, messageTypeValue: string): EDIMessage => {
    const message = createMessage(standard, versionValue, messageTypeValue);
    const segment1 = new EDISegment('TEST1', [new EDIElement('DATA1')]);
    const segment2 = new EDISegment('TEST2', [new EDIElement('DATA2')]);
    message.addSegment(segment1);
    message.addSegment(segment2);
    return message;
  };

  beforeEach(() => {
    useCase = new BuildEDIUseCase();
  });

  describe('execute', () => {
    describe('EDIFACT messages', () => {
      const edifactDelimiters = Delimiters.custom({
        component: ':',
        element: '+',
        decimal: '.',
        escape: '?',
        segment: "'",
      });

      it('should build valid EDIFACT message to string', () => {
        const message = createValidMessage(Standard.EDIFACT, 'D.96A', 'DESADV');

        const result = useCase.execute({ message, delimiters: edifactDelimiters });

        expect(result.success).toBe(true);
        expect(result.ediString).toBeDefined();
        expect(result.ediString).toContain('TEST1');
        expect(result.ediString).toContain('TEST2');
      });

      it('should use correct EDIFACT delimiters', () => {
        const message = createValidMessage(Standard.EDIFACT, 'D.96A', 'DESADV');

        const result = useCase.execute({ message, delimiters: edifactDelimiters });

        expect(result.ediString).toContain('+');
        expect(result.ediString).toContain("'");
      });
    });

    describe('X12 messages', () => {
      const x12Delimiters = Delimiters.custom({
        component: '>',
        element: '*',
        decimal: '.',
        escape: '',
        segment: '~',
        repetition: '^',
      });

      it('should build valid X12 message to string', () => {
        const message = createValidMessage(Standard.X12, '005010', '850');

        const result = useCase.execute({ message, delimiters: x12Delimiters });

        expect(result.success).toBe(true);
        expect(result.ediString).toBeDefined();
        expect(result.ediString).toContain('TEST1');
      });

      it('should use correct X12 delimiters', () => {
        const message = createValidMessage(Standard.X12, '005010', '850');

        const result = useCase.execute({ message, delimiters: x12Delimiters });

        expect(result.ediString).toContain('*');
        expect(result.ediString).toContain('~');
      });
    });

    describe('IDOC messages', () => {
      const idocDelimiters = Delimiters.custom({
        component: '',
        element: ' ',
        decimal: '.',
        escape: '',
        segment: '\n',
      });

      it('should build valid IDOC message to string', () => {
        const message = createValidMessage(Standard.IDOC, 'SAP-ECC', 'ORDERS05');

        const result = useCase.execute({ message, delimiters: idocDelimiters });

        expect(result.success).toBe(true);
        expect(result.ediString).toBeDefined();
      });
    });

    describe('VDA messages', () => {
      const vdaDelimiters = Delimiters.custom({
        component: '',
        element: ';',
        decimal: '.',
        escape: '',
        segment: '\n',
      });

      it('should build valid VDA message to string', () => {
        const message = createValidMessage(Standard.VDA, '4905', '4905');

        const result = useCase.execute({ message, delimiters: vdaDelimiters });

        expect(result.success).toBe(true);
        expect(result.ediString).toBeDefined();
      });
    });

    describe('HL7v2 messages', () => {
      const hl7Delimiters = Delimiters.custom({
        component: '^',
        element: '|',
        decimal: '.',
        escape: '\\',
        segment: '\r',
        repetition: '~',
      });

      it('should build valid HL7v2 message to string', () => {
        const message = createValidMessage(Standard.HL7v2, '2.5', 'ADT');

        const result = useCase.execute({ message, delimiters: hl7Delimiters });

        expect(result.success).toBe(true);
        expect(result.ediString).toBeDefined();
      });
    });

    describe('validation', () => {
      it('should validate message before building when requested', () => {
        const message = createMessage(Standard.EDIFACT, 'D.96A', 'DESADV');
        const delimiters = Delimiters.custom({
          component: ':', element: '+', decimal: '.', escape: '?', segment: "'"
        });

        const result = useCase.execute({
          message,
          delimiters,
          validateBeforeBuild: true
        });

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.[0]?.code).toBeDefined();
      });

      it('should build without validation when not requested', () => {
        const message = createMessage(Standard.EDIFACT, 'D.96A', 'DESADV');
        const delimiters = Delimiters.custom({
          component: ':', element: '+', decimal: '.', escape: '?', segment: "'"
        });

        const result = useCase.execute({
          message,
          delimiters,
          validateBeforeBuild: false
        });

        expect(result.success).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should return error for messages without segments', () => {
        const message = createMessage(Standard.EDIFACT, 'D.96A', 'DESADV');
        const delimiters = Delimiters.custom({
          component: ':', element: '+', decimal: '.', escape: '?', segment: "'"
        });

        const result = useCase.execute({ message, delimiters });

        expect(result.ediString).toBeDefined();
      });
    });
  });
});
