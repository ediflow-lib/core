import { describe, it, expect, vi } from 'vitest';
import { BuildEDIUseCase } from './BuildEDIUseCase';
import { EDIMessage, EDISegment, EDIElement, Standard, Version, MessageType } from '@domain';
import type { IMessageBuilder, IEnvelopeBuilder } from '@application/ports/output';
import type { MessageStructureDTO } from '@application/dtos';
import { StructureMappingService } from '@application/services/StructureMappingService';

const createMessage = (): EDIMessage => {
  const msg = new EDIMessage(
    '1',
    Standard.EDIFACT,
    new Version(Standard.EDIFACT, 'D.20B'),
    new MessageType(Standard.EDIFACT, 'ORDERS'),
  );
  msg.addSegment(new EDISegment('BGM', [new EDIElement('220')]));
  return msg;
};

const mockBuilder = (): IMessageBuilder => ({
  build: vi.fn().mockReturnValue("BGM+220'"),
  getSupportedStandard: vi.fn().mockReturnValue(Standard.EDIFACT),
});

const mockEnvelopeBuilder = (): IEnvelopeBuilder => ({
  wrapMessage: vi.fn().mockImplementation((msg: EDIMessage) => msg),
  wrapInterchange: vi.fn().mockImplementation((msgs: EDIMessage[]) => msgs[0] as EDIMessage),
  getSupportedStandard: vi.fn().mockReturnValue(Standard.EDIFACT),
});

describe('BuildEDIUseCase', () => {
  describe('execute — input resolution', () => {
    it('returns MISSING_INPUT error when no message and no businessObject provided', () => {
      const useCase = new BuildEDIUseCase(mockBuilder());
      const result = useCase.execute({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('MISSING_INPUT');
      }
    });

    it('builds successfully from direct EDIMessage input', () => {
      const builder = mockBuilder();
      const useCase = new BuildEDIUseCase(builder);
      const result = useCase.execute({ message: createMessage() });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ediString).toBe("BGM+220'");
      }
      expect(builder.build).toHaveBeenCalledOnce();
    });

    it('builds from businessObject via StructureMappingService.unmap', () => {
      const message = createMessage();
      const mapper = { unmap: vi.fn().mockReturnValue(message) } as unknown as StructureMappingService;
      const builder = mockBuilder();
      const useCase = new BuildEDIUseCase(builder, undefined, mapper);
      const structure = {} as MessageStructureDTO;

      const result = useCase.execute({
        businessObject: { documentNumber: 'PO-001' },
        messageStructure: structure,
        businessObjectKeyStyle: 'camelCase',
      });

      expect(result.success).toBe(true);
      expect(mapper.unmap).toHaveBeenCalledWith({ documentNumber: 'PO-001' }, structure, 'camelCase');
    });

    it('uses default key style "code" when businessObjectKeyStyle is omitted', () => {
      const message = createMessage();
      const mapper = { unmap: vi.fn().mockReturnValue(message) } as unknown as StructureMappingService;
      const useCase = new BuildEDIUseCase(mockBuilder(), undefined, mapper);

      useCase.execute({
        businessObject: {},
        messageStructure: {} as MessageStructureDTO,
      });

      expect(mapper.unmap).toHaveBeenCalledWith({}, {}, 'code');
    });

    it('returns MISSING_INPUT when businessObject provided but no mapper injected', () => {
      const useCase = new BuildEDIUseCase(mockBuilder());
      const result = useCase.execute({
        businessObject: {},
        messageStructure: {} as MessageStructureDTO,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('MISSING_INPUT');
      }
    });
  });

  describe('execute — envelope wrapping', () => {
    it('returns MISSING_ENVELOPE_BUILDER when includeEnvelope=true but no builder injected', () => {
      const useCase = new BuildEDIUseCase(mockBuilder());
      const result = useCase.execute({ message: createMessage(), includeEnvelope: true });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('MISSING_ENVELOPE_BUILDER');
      }
    });

    it('returns MISSING_ENVELOPE_CONFIG when messageType or version are missing', () => {
      const useCase = new BuildEDIUseCase(mockBuilder(), mockEnvelopeBuilder());
      const result = useCase.execute({ message: createMessage(), includeEnvelope: true });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('MISSING_ENVELOPE_CONFIG');
      }
    });

    it('returns MISSING_INTERCHANGE_CONFIG when includeInterchange=true but sender/receiver missing', () => {
      const useCase = new BuildEDIUseCase(mockBuilder(), mockEnvelopeBuilder());
      const result = useCase.execute({
        message: createMessage(),
        includeEnvelope: true,
        includeInterchange: true,
        messageType: 'ORDERS',
        version: 'D.20B',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('MISSING_INTERCHANGE_CONFIG');
      }
    });

    it('wraps with envelope only (no interchange) when includeEnvelope=true', () => {
      const envelopeBuilder = mockEnvelopeBuilder();
      const useCase = new BuildEDIUseCase(mockBuilder(), envelopeBuilder);
      const result = useCase.execute({
        message: createMessage(),
        includeEnvelope: true,
        messageType: 'ORDERS',
        version: 'D.20B',
        messageRef: 'REF001',
      });
      expect(result.success).toBe(true);
      expect(envelopeBuilder.wrapMessage).toHaveBeenCalledOnce();
      expect(envelopeBuilder.wrapInterchange).not.toHaveBeenCalled();
    });

    it('wraps with envelope AND interchange when includeInterchange=true', () => {
      const envelopeBuilder = mockEnvelopeBuilder();
      const useCase = new BuildEDIUseCase(mockBuilder(), envelopeBuilder);
      const result = useCase.execute({
        message: createMessage(),
        includeEnvelope: true,
        includeInterchange: true,
        messageType: 'ORDERS',
        version: 'D.20B',
        sender: 'SENDER',
        receiver: 'RECEIVER',
      });
      expect(result.success).toBe(true);
      expect(envelopeBuilder.wrapMessage).toHaveBeenCalledOnce();
      expect(envelopeBuilder.wrapInterchange).toHaveBeenCalledOnce();
    });

    it('generates messageRef and controlRef automatically when not provided', () => {
      const envelopeBuilder = mockEnvelopeBuilder();
      const useCase = new BuildEDIUseCase(mockBuilder(), envelopeBuilder);
      useCase.execute({
        message: createMessage(),
        includeEnvelope: true,
        includeInterchange: true,
        messageType: 'ORDERS',
        version: 'D.20B',
        sender: 'S',
        receiver: 'R',
      });
      const [, opts] = (envelopeBuilder.wrapMessage as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(opts.messageRef).toBeTruthy();
    });
  });

  describe('execute — validation before build', () => {
    it('returns validation errors when validateBeforeBuild=true and message is invalid', () => {
      const emptyMsg = new EDIMessage(
        '1',
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS'),
      );
      const useCase = new BuildEDIUseCase(mockBuilder());
      const result = useCase.execute({ message: emptyMsg, validateBeforeBuild: true });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('builds successfully when validateBeforeBuild=true and message is valid', () => {
      const useCase = new BuildEDIUseCase(mockBuilder());
      const result = useCase.execute({ message: createMessage(), validateBeforeBuild: true });
      expect(result.success).toBe(true);
    });
  });

  describe('execute — error handling', () => {
    it('returns BUILD_ERROR when builder.build throws', () => {
      const builder: IMessageBuilder = {
        build: vi.fn().mockImplementation(() => { throw new Error('build failed'); }),
        getSupportedStandard: vi.fn().mockReturnValue(Standard.EDIFACT),
      };
      const useCase = new BuildEDIUseCase(builder);
      const result = useCase.execute({ message: createMessage() });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('BUILD_ERROR');
        expect(result.errors[0].message).toBe('build failed');
      }
    });

    it('returns BUILD_ERROR with generic message for non-Error throws', () => {
      const builder: IMessageBuilder = {
        build: vi.fn().mockImplementation(() => { throw 'crash'; }),
        getSupportedStandard: vi.fn().mockReturnValue(Standard.EDIFACT),
      };
      const useCase = new BuildEDIUseCase(builder);
      const result = useCase.execute({ message: createMessage() });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].message).toBe('Unknown error occurred');
      }
    });
  });
});

