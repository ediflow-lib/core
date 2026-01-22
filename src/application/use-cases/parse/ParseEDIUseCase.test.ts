import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParseEDIUseCase } from './ParseEDIUseCase';
import { ParseEDIInputDTO } from './ParseEDIInputDTO';
import { IDelimiterDetector, ITokenizer, IParser } from '../../ports';
import { Standard, Delimiters, EDIMessage, Version, MessageType } from '../../../domain';

describe('ParseEDIUseCase', () => {
  let useCase: ParseEDIUseCase;
  let mockDelimiterDetector: IDelimiterDetector;
  let mockTokenizer: ITokenizer;
  let mockParser: IParser;

  const createMockEDIMessage = (standard: Standard, versionValue: string, messageTypeValue: string): EDIMessage => {
    return new EDIMessage(
      standard,
      new Version(standard, versionValue),
      new MessageType(standard, messageTypeValue)
    );
  };

  const setupMocksForStandard = (
    delimiters: Delimiters,
    segments: string[],
    message: EDIMessage,
    removeHeader: (msg: string) => string = (msg) => msg
  ): void => {
    mockDelimiterDetector.detect = vi.fn().mockReturnValue(delimiters);
    mockDelimiterDetector.getMessageWithoutFormatSpecificHeader = vi.fn(removeHeader);
    mockTokenizer.tokenize = vi.fn().mockReturnValue(segments);
    mockParser.parse = vi.fn().mockReturnValue(message);
    mockParser.getSupportedStandard = vi.fn().mockReturnValue(message.standard);
  };

  beforeEach(() => {
    mockDelimiterDetector = {
      detect: vi.fn(),
      getMessageWithoutFormatSpecificHeader: vi.fn(),
    };

    mockTokenizer = {
      tokenize: vi.fn(),
    };

    mockParser = {
      parse: vi.fn(),
      getSupportedStandard: vi.fn(),
      canParse: vi.fn().mockReturnValue(true),
    };

    useCase = new ParseEDIUseCase(
      mockDelimiterDetector,
      mockTokenizer,
      mockParser
    );
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

      beforeEach(() => {
        mockDelimiterDetector.detect = vi.fn().mockReturnValue(edifactDelimiters);
        mockDelimiterDetector.getMessageWithoutFormatSpecificHeader = vi.fn((msg) =>
          msg.startsWith('UNA') ? msg.substring(9) : msg
        );

        mockTokenizer.tokenize = vi.fn().mockReturnValue([
          'UNH+1+DESADV:D:96A:UN',
          'BGM+351+12345',
          'UNT+3+1',
        ]);

        const mockMessage = new EDIMessage(
          Standard.EDIFACT,
          new Version(Standard.EDIFACT, 'D.96A'),
          new MessageType(Standard.EDIFACT, 'DESADV')
        );
        mockParser.parse = vi.fn().mockReturnValue(mockMessage);
        mockParser.getSupportedStandard = vi.fn().mockReturnValue(Standard.EDIFACT);
      });

      it('should parse EDIFACT message successfully', () => {
        const input: ParseEDIInputDTO = {
          message: "UNA:+.? 'UNH+1+DESADV:D:96A:UN'BGM+351+12345'UNT+3+1'",
          standard: Standard.EDIFACT,
        };

        const result = useCase.execute(input);

        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.metadata.standard).toBe(Standard.EDIFACT);
        expect(result.metadata.segmentCount).toBe(3);
        expect(result.metadata.delimiters).toBe(edifactDelimiters);
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

      beforeEach(() => {
        mockDelimiterDetector.detect = vi.fn().mockReturnValue(x12Delimiters);
        mockDelimiterDetector.getMessageWithoutFormatSpecificHeader = vi.fn((msg) => msg);

        mockTokenizer.tokenize = vi.fn().mockReturnValue([
          'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *210122*1200*^*00501*000000001*0*P*>',
          'GS*PO*SENDER*RECEIVER*20210122*1200*1*X*005010',
          'ST*850*0001',
          'SE*3*0001',
          'GE*1*1',
          'IEA*1*000000001',
        ]);

        const mockMessage = new EDIMessage(
          Standard.X12,
          new Version(Standard.X12, '005010'),
          new MessageType(Standard.X12, '850')
        );
        mockParser.parse = vi.fn().mockReturnValue(mockMessage);
        mockParser.getSupportedStandard = vi.fn().mockReturnValue(Standard.X12);
      });

      it('should parse X12 message successfully', () => {
        const input: ParseEDIInputDTO = {
          message: 'ISA*00*...*ST*850*0001~SE*3*0001~',
          standard: Standard.X12,
        };

        const result = useCase.execute(input);

        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.metadata.standard).toBe(Standard.X12);
        expect(result.metadata.delimiters).toBe(x12Delimiters);
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

      beforeEach(() => {
        mockDelimiterDetector.detect = vi.fn().mockReturnValue(idocDelimiters);
        mockDelimiterDetector.getMessageWithoutFormatSpecificHeader = vi.fn((msg) => msg);

        mockTokenizer.tokenize = vi.fn().mockReturnValue([
          'EDI_DC40',
          'E1EDK01',
          'E1EDK14',
          'E1EDKA1',
        ]);

        const mockMessage = new EDIMessage(
          Standard.IDOC,
          new Version(Standard.IDOC, 'SAP-ECC'),
          new MessageType(Standard.IDOC, 'ORDERS05')
        );
        mockParser.parse = vi.fn().mockReturnValue(mockMessage);
        mockParser.getSupportedStandard = vi.fn().mockReturnValue(Standard.IDOC);
      });

      it('should parse IDOC message successfully', () => {
        const input: ParseEDIInputDTO = {
          message: 'EDI_DC40\nE1EDK01\nE1EDK14\n',
          standard: Standard.IDOC,
        };

        const result = useCase.execute(input);

        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.metadata.standard).toBe(Standard.IDOC);
        expect(result.metadata.delimiters).toBe(idocDelimiters);
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

      beforeEach(() => {
        mockDelimiterDetector.detect = vi.fn().mockReturnValue(vdaDelimiters);
        mockDelimiterDetector.getMessageWithoutFormatSpecificHeader = vi.fn((msg) => msg);

        mockTokenizer.tokenize = vi.fn().mockReturnValue([
          '511;SUPPLIER;20260122;1200',
          '512;BUYER;ADDRESS',
          '513;DELIVERY',
        ]);

        const mockMessage = new EDIMessage(
          Standard.VDA,
          new Version(Standard.VDA, '4905'),
          new MessageType(Standard.VDA, '4905')
        );
        mockParser.parse = vi.fn().mockReturnValue(mockMessage);
        mockParser.getSupportedStandard = vi.fn().mockReturnValue(Standard.VDA);
      });

      it('should parse VDA message successfully', () => {
        const input: ParseEDIInputDTO = {
          message: '511;SUPPLIER;20260122;1200\n512;BUYER;ADDRESS\n',
          standard: Standard.VDA,
        };

        const result = useCase.execute(input);

        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.metadata.standard).toBe(Standard.VDA);
        expect(result.metadata.delimiters).toBe(vdaDelimiters);
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

      beforeEach(() => {
        mockDelimiterDetector.detect = vi.fn().mockReturnValue(hl7Delimiters);
        mockDelimiterDetector.getMessageWithoutFormatSpecificHeader = vi.fn((msg) => msg);

        mockTokenizer.tokenize = vi.fn().mockReturnValue([
          'MSH|^~\\&|SENDING_APP|SENDING_FACILITY|RECEIVING_APP|RECEIVING_FACILITY|20260122120000||ADT^A01|MSG00001|P|2.5',
          'EVN|A01|20260122120000',
          'PID|1||PATIENT_ID||DOE^JOHN',
        ]);

        const mockMessage = new EDIMessage(
          Standard.HL7v2,
          new Version(Standard.HL7v2, '2.5'),
          new MessageType(Standard.HL7v2, 'ADT')
        );
        mockParser.parse = vi.fn().mockReturnValue(mockMessage);
        mockParser.getSupportedStandard = vi.fn().mockReturnValue(Standard.HL7v2);
      });

      it('should parse HL7v2 message successfully', () => {
        const input: ParseEDIInputDTO = {
          message: 'MSH|^~\\&|SENDING_APP|...\rEVN|A01|\rPID|1||\r',
          standard: Standard.HL7v2,
        };

        const result = useCase.execute(input);

        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.metadata.standard).toBe(Standard.HL7v2);
        expect(result.metadata.delimiters).toBe(hl7Delimiters);
      });
    });

    describe('standard-agnostic behavior', () => {
      const createSimpleSetup = (headerRemoval: (msg: string) => string = (msg) => msg) => {
        const delimiters = Delimiters.custom({
          component: ':', element: '+', decimal: '.', escape: '?', segment: "'"
        });
        const message = createMockEDIMessage(Standard.EDIFACT, 'D.96A', 'DESADV');
        setupMocksForStandard(delimiters, ['UNH+1+DESADV'], message, headerRemoval);
        return { delimiters, message };
      };

      it('should call delimiter detector with original message', () => {
        createSimpleSetup();
        const input: ParseEDIInputDTO = {
          message: "UNA:+.? 'UNH+1+DESADV'",
          standard: Standard.EDIFACT,
        };

        useCase.execute(input);

        expect(mockDelimiterDetector.detect).toHaveBeenCalledWith(input.message);
      });

      it('should remove format-specific header before tokenizing', () => {
        createSimpleSetup((msg) => msg.substring(9));
        const input: ParseEDIInputDTO = {
          message: "UNA:+.? 'UNH+1+DESADV'BGM+351'",
          standard: Standard.EDIFACT,
        };

        useCase.execute(input);

        expect(mockDelimiterDetector.getMessageWithoutFormatSpecificHeader).toHaveBeenCalledWith(input.message);
      });

      it('should tokenize with detected delimiters', () => {
        const { delimiters } = createSimpleSetup((msg) => msg.substring(9));
        const input: ParseEDIInputDTO = {
          message: "UNA:+.? 'UNH+1+DESADV'",
          standard: Standard.EDIFACT,
        };

        useCase.execute(input);

        const tokenizeCall = (mockTokenizer.tokenize as any).mock.calls[0];
        expect(tokenizeCall).toBeDefined();
        const [, tokenDelimiters] = tokenizeCall;
        expect(tokenDelimiters).toBe(delimiters);
      });

      it('should parse segments into EDIMessage', () => {
        createSimpleSetup();
        const input: ParseEDIInputDTO = {
          message: "UNA:+.? 'UNH+1+DESADV'",
          standard: Standard.EDIFACT,
        };


        useCase.execute(input);

        expect(mockParser.parse).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should return error if message is empty', () => {
        const result = useCase.execute({
          message: '',
          standard: Standard.EDIFACT,
        });

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0]?.code).toBe('EMPTY_MESSAGE');
      });

      it('should return error if parsing fails', () => {
        const delimiters = Delimiters.custom({
          component: ':', element: '+', decimal: '.', escape: '?', segment: "'"
        });
        mockDelimiterDetector.detect = vi.fn().mockReturnValue(delimiters);
        mockDelimiterDetector.getMessageWithoutFormatSpecificHeader = vi.fn((msg) => msg);
        mockTokenizer.tokenize = vi.fn().mockReturnValue(['INVALID']);
        mockParser.parse = vi.fn().mockImplementation(() => {
          throw new Error('Invalid segment format');
        });

        const result = useCase.execute({
          message: "UNA:+.? 'INVALID'",
          standard: Standard.EDIFACT,
        });

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0]?.message).toContain('Invalid segment format');
      });
    });

    describe('metadata', () => {
      it('should include complete metadata in output', () => {
        const delimiters = Delimiters.custom({
          component: ':', element: '+', decimal: '.', escape: '?', segment: "'"
        });
        const message = createMockEDIMessage(Standard.EDIFACT, 'D.96A', 'DESADV');
        const segments = ['UNH+1+DESADV', 'BGM+351', 'UNT+3+1'];
        setupMocksForStandard(delimiters, segments, message, (msg) => msg.substring(9));

        const input: ParseEDIInputDTO = {
          message: "UNA:+.? 'UNH+1+DESADV'",
          standard: Standard.EDIFACT,
        };

        const result = useCase.execute(input);

        expect(result.metadata).toBeDefined();
        expect(result.metadata.standard).toBe(Standard.EDIFACT);
        expect(result.metadata.version).toBeDefined();
        expect(result.metadata.messageType).toBeDefined();
        expect(result.metadata.delimiters).toBe(delimiters);
        expect(result.metadata.segmentCount).toBe(segments.length);
      });
    });
  });
});

