import { describe, it, expect, beforeAll } from 'vitest';
import { DIContainer } from '../../../src/infrastructure/container';
import { Standard } from '@ediflow/core';

/**
 * CLI Integration Tests — X12
 *
 * Tests ALL use cases via DIContainer with real X12 messages.
 * No mocks. Full stack: DIContainer → UseCase → Parser/Validator.
 *
 * Use Cases covered:
 *   1. Parse    — 850 (syntax + structure check), 810 Invoice, 856 ASN, 837 Healthcare Claim, 997 ACK
 *   2. Validate — valid message
 *   3. Schema   — export 850 004010 JSON Schema
 */
describe('CLI Integration — X12', () => {
  let container: DIContainer;

  beforeAll(() => {
    container = DIContainer.getInstance();
  });

  // ─── X12 test messages ────────────────────────────────────────────────────

  const X12_850 = [
    'ISA*00*          *00*          *ZZ*ACMECORP       *ZZ*SUPPLIER       *260204*1030*^*00501*000000001*0*P*>~',
    'GS*PO*ACMECORP*SUPPLIER*20260204*1030*1*X*005010~',
    'ST*850*0001~',
    'BEG*00*SA*PO123456**20260204~',
    'REF*DP*DEPT001~',
    'DTM*002*20260210~',
    'N1*BY*ACME Corporation*92*BUYER123~',
    'N3*123 Main Street~',
    'N4*New York*NY*10001~',
    'N1*SE*Best Supplier Inc*92*SUPP456~',
    'PO1*1*100*EA*10.50*PE*BP*WIDGET-A~',
    'PO1*2*50*EA*25.00*PE*BP*GADGET-B~',
    'CTT*2~',
    'SE*12*0001~',
    'GE*1*1~',
    'IEA*1*000000001~',
  ].join('');

  const X12_810 = [
    'ISA*00*          *00*          *ZZ*SUPPLIER       *ZZ*ACMECORP       *260205*0800*^*00501*000000002*0*P*>~',
    'GS*IN*SUPPLIER*ACMECORP*20260205*0800*2*X*005010~',
    'ST*810*0001~',
    'BIG*20260205*INV-2026-001**PO123456~',
    'REF*DP*DEPT001~',
    'N1*SE*Best Supplier Inc*92*SUPP456~',
    'N1*BY*ACME Corporation*92*BUYER123~',
    'IT1*1*100*EA*10.50**BP*WIDGET-A~',
    'IT1*2*50*EA*25.00**BP*GADGET-B~',
    'TDS*230000~',
    'SE*9*0001~',
    'GE*1*2~',
    'IEA*1*000000002~',
  ].join('');

  const X12_856 = [
    'ISA*00*          *00*          *ZZ*SUPPLIER       *ZZ*ACMECORP       *260206*0900*^*00501*000000003*0*P*>~',
    'GS*SH*SUPPLIER*ACMECORP*20260206*0900*3*X*005010~',
    'ST*856*0001~',
    'BSN*00*SHIP-2026-001*20260206*0900~',
    'DTM*011*20260206~',
    'HL*1**S~',
    'TD1*CTN*2~',
    'TD5**2*FEDEX~',
    'REF*BM*TRACK123456~',
    'N1*SF*Best Supplier Inc~',
    'N1*ST*ACME Corporation~',
    'HL*2*1*O~',
    'PRF*PO123456~',
    'HL*3*2*I~',
    'LIN*1**BP*WIDGET-A~',
    'SN1**100*EA~',
    'HL*4*2*I~',
    'LIN*2**BP*GADGET-B~',
    'SN1**50*EA~',
    'CTT*2~',
    'SE*19*0001~',
    'GE*1*3~',
    'IEA*1*000000003~',
  ].join('');

  const X12_997 = [
    'ISA*00*          *00*          *ZZ*ACMECORP       *ZZ*SUPPLIER       *260204*1035*^*00501*000000004*0*P*>~',
    'GS*FA*ACMECORP*SUPPLIER*20260204*1035*4*X*005010~',
    'ST*997*0001~',
    'AK1*PO*1~',
    'AK9*A*1*1*1~',
    'SE*4*0001~',
    'GE*1*4~',
    'IEA*1*000000004~',
  ].join('');

  const X12_837 = [
    'ISA*00*          *00*          *ZZ*PROVIDER       *ZZ*CLEARINGHS     *260204*0900*^*00501*000000005*0*P*>~',
    'GS*HC*PROVIDER*CLEARINGHS*20260204*0900*5*X*005010~',
    'ST*837*0001~',
    'BPR*I*1500.00*C*ACH~',
    'NM1*85*2*CITY MEDICAL CENTER****XX*1234567890~',
    'NM1*IL*1*DOE*JOHN*A***MI*MEMB123~',
    'CLM*CLAIM001*1500.00***11:B:1*Y*A*Y*I~',
    'SE*6*0001~',
    'GE*1*5~',
    'IEA*1*000000005~',
  ].join('');

  // ═══════════════════════════════════════════════════════════════════════════
  // USE CASE 1: Parse
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Parse', () => {
    it('should parse X12 850 Purchase Order — standard, version, type, segments', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_850, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata.standard).toBe(Standard.X12);
      expect(result.metadata.version.value).toBe('005010');
      expect(result.metadata.messageType.value).toBe('850');
      expect(result.metadata.segmentCount).toBeGreaterThan(0);
    });

    it('should parse X12 850 — detect delimiters (segment=~, element=*, component=>)', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_850, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata.delimiters?.segment).toBe('~');
      expect(result.metadata.delimiters?.element).toBe('*');
      expect(result.metadata.delimiters?.component).toBe('>');
    });

    it('should parse X12 850 — BEG has PO number PO123456', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_850, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const beg = result.message.segments.find(s => s.tag === 'BEG');
      expect(beg).toBeDefined();
      expect(beg!.elements[2]?.value).toBe('PO123456');
    });

    it('should parse X12 850 — N1 buyer ACME Corporation', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_850, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const buyer = result.message.segments.find(
        s => s.tag === 'N1' && s.elements[0]?.value === 'BY'
      );
      expect(buyer).toBeDefined();
      expect(buyer!.elements[1]?.value).toBe('ACME Corporation');
    });

    it('should parse X12 850 — 2 PO1 line items (WIDGET-A, GADGET-B)', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_850, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const lines = result.message.segments.filter(s => s.tag === 'PO1');
      expect(lines).toHaveLength(2);
      expect(lines[0]!.elements[6]?.value).toBe('WIDGET-A');
      expect(lines[1]!.elements[6]?.value).toBe('GADGET-B');
    });

    it('should parse X12 810 Invoice — type 810, invoice INV-2026-001', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_810, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata.messageType.value).toBe('810');

      const big = result.message.segments.find(s => s.tag === 'BIG');
      expect(big!.elements[1]?.value).toBe('INV-2026-001');
    });

    it('should parse X12 856 ASN — type 856, shipment SHIP-2026-001', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_856, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata.messageType.value).toBe('856');

      const bsn = result.message.segments.find(s => s.tag === 'BSN');
      expect(bsn!.elements[1]?.value).toBe('SHIP-2026-001');
    });

    it('should parse X12 997 Functional ACK — type 997, group PO accepted', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_997, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata.messageType.value).toBe('997');

      const ak1 = result.message.segments.find(s => s.tag === 'AK1');
      expect(ak1!.elements[0]?.value).toBe('PO');

      const ak9 = result.message.segments.find(s => s.tag === 'AK9');
      expect(ak9!.elements[0]?.value).toBe('A');
    });

    it('should parse X12 837 Healthcare Claim — type 837, claim CLAIM001', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_837, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata.messageType.value).toBe('837');

      const clm = result.message.segments.find(s => s.tag === 'CLM');
      expect(clm!.elements[0]?.value).toBe('CLAIM001');
      expect(clm!.elements[1]?.value).toBe('1500.00');
    });

    it('should return error for empty message', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: '', standard: Standard.X12 });

      expect(result.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USE CASE 1b: Parse + Structure Enrichment — X12 850 004010
  //
  // Verifies that MessageStructureBuilder fully resolves segment definitions
  // (tag, elements with code/name) from the 004010 data package.
  // Then verifies the parsed EDI message segments match the expected structure.
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Parse + Structure (X12 850 004010)', () => {
    it('should load 850 004010 structure — standard, version, messageType match', async () => {
      const structure = await container.repository.getMessageStructure('X12', '004010', '850');

      expect(structure).not.toBeNull();
      expect(structure!.standard).toBe('X12');
      expect(structure!.version).toBe('004010');
      expect(structure!.messageType).toBe('850');
    });

    it('should load 850 004010 structure — BEG segment resolved with tag and elements', async () => {
      const structure = await container.repository.getMessageStructure('X12', '004010', '850');
      expect(structure).not.toBeNull();

      const begNode = structure!.structure.find(
        node => node.nodeType === 'segment' && (node as any).tag === 'BEG'
      ) as any;

      expect(begNode).toBeDefined();
      expect(begNode.tag).toBe('BEG');
      expect(begNode.name).toBeDefined();
      expect(begNode.elements).toBeDefined();
      expect(begNode.elements.length).toBeGreaterThan(0);
    });

    it('should load 850 004010 structure — BEG elements have code and nodeType', async () => {
      const structure = await container.repository.getMessageStructure('X12', '004010', '850');
      expect(structure).not.toBeNull();

      const begNode = structure!.structure.find(
        node => node.nodeType === 'segment' && (node as any).tag === 'BEG'
      ) as any;

      expect(begNode).toBeDefined();
      for (const element of begNode.elements) {
        expect(element.code).toBeDefined();
        expect(element.nodeType).toMatch(/^(element|composite)$/);
      }
    });

    it('should match parsed 850 BEG against expected values and structure definition', async () => {
      const structure = await container.repository.getMessageStructure('X12', '004010', '850');
      expect(structure).not.toBeNull();

      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_850, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const parsedBeg = result.message.segments.find(s => s.tag === 'BEG');
      const structureBeg = structure!.structure.find(
        node => node.nodeType === 'segment' && (node as any).tag === 'BEG'
      ) as any;

      expect(parsedBeg).toBeDefined();
      expect(structureBeg).toBeDefined();

      // Expected parsed BEG values from X12_850: BEG*00*SA*PO123456**20260204
      const expectedBeg = {
        tag: 'BEG',
        transactionSetPurposeCode: '00',
        purchaseOrderTypeCode: 'SA',
        purchaseOrderNumber: 'PO123456',
        date: '20260204',
      };

      expect(parsedBeg!.tag).toBe(expectedBeg.tag);
      expect(parsedBeg!.elements[0]?.value).toBe(expectedBeg.transactionSetPurposeCode);
      expect(parsedBeg!.elements[1]?.value).toBe(expectedBeg.purchaseOrderTypeCode);
      expect(parsedBeg!.elements[2]?.value).toBe(expectedBeg.purchaseOrderNumber);
      // elements[3] is empty (**), elements[4] = date
      expect(parsedBeg!.elements[4]?.value).toBe(expectedBeg.date);

      // Structure definition must have at least 5 element positions for BEG
      expect(structureBeg.elements.length).toBeGreaterThanOrEqual(5);
    });

    it('should match parsed 850 PO1 line items against expected values', async () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_850, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const po1Segments = result.message.segments.filter(s => s.tag === 'PO1');
      expect(po1Segments).toHaveLength(2);

      // PO1*1*100*EA*10.50*PE*BP*WIDGET-A
      // PO1*2*50*EA*25.00*PE*BP*GADGET-B
      const expectedLineItems = [
        { lineNumber: '1', quantity: '100', uom: 'EA', unitPrice: '10.50', productId: 'WIDGET-A' },
        { lineNumber: '2', quantity: '50',  uom: 'EA', unitPrice: '25.00', productId: 'GADGET-B' },
      ];

      for (let i = 0; i < expectedLineItems.length; i++) {
        const po1 = po1Segments[i]!;
        const expected = expectedLineItems[i]!;

        expect(po1.elements[0]?.value).toBe(expected.lineNumber);
        expect(po1.elements[1]?.value).toBe(expected.quantity);
        expect(po1.elements[2]?.value).toBe(expected.uom);
        expect(po1.elements[3]?.value).toBe(expected.unitPrice);
        expect(po1.elements[6]?.value).toBe(expected.productId);
      }
    });

    it('should match full parsed 850 segment tag sequence against expected order', async () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('X12');
      const result = useCase.execute({ message: X12_850, standard: Standard.X12 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const expectedTagSequence = [
        'ST', 'BEG', 'REF', 'DTM',
        'N1', 'N3', 'N4',
        'N1',
        'PO1', 'PO1',
        'CTT', 'SE',
      ];

      expect(result.message.segments.map(s => s.tag)).toEqual(expectedTagSequence);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USE CASE 2: Validate
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Validate', () => {
    it('should validate parsed X12 850 — isValid true, 0 errors', () => {
      const parseUseCase    = container.getUseCaseFactory().createParseUseCase('X12');
      const validateUseCase = container.getUseCaseFactory().createValidateUseCase();

      const parsed = parseUseCase.execute({ message: X12_850, standard: Standard.X12 });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const result = validateUseCase.execute({ message: parsed.message });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.validationResult.isValid).toBe(true);
      expect(result.validationResult.errors).toHaveLength(0);
    });

    it('should validate parsed X12 810 — isValid true', () => {
      const parseUseCase    = container.getUseCaseFactory().createParseUseCase('X12');
      const validateUseCase = container.getUseCaseFactory().createValidateUseCase();

      const parsed = parseUseCase.execute({ message: X12_810, standard: Standard.X12 });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const result = validateUseCase.execute({ message: parsed.message });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.validationResult.isValid).toBe(true);
    });

    it('should validate parsed X12 837 Healthcare Claim — isValid true', () => {
      const parseUseCase    = container.getUseCaseFactory().createParseUseCase('X12');
      const validateUseCase = container.getUseCaseFactory().createValidateUseCase();

      const parsed = parseUseCase.execute({ message: X12_837, standard: Standard.X12 });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const result = validateUseCase.execute({ message: parsed.message });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.validationResult.isValid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USE CASE 3: Export Schema
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Export Schema', () => {
    it('should export X12 004010 850 JSON Schema — valid $schema, title, type', async () => {
      const schema = await container.exportSchemaCommand.execute({
        standard: 'X12',
        version: '004010',
        message: '850',
        format: 'json',
      });

      const parsed = JSON.parse(schema);
      expect(parsed.$schema).toBeDefined();
      expect(parsed.title).toBeDefined();
      expect(parsed.type).toBe('object');
    });

    it('should export X12 004010 850 JSON Schema — title contains Purchase Order', async () => {
      const schema = await container.exportSchemaCommand.execute({
        standard: 'X12',
        version: '004010',
        message: '850',
        format: 'json',
      });

      const parsed = JSON.parse(schema);
      expect(parsed.title).toContain('Purchase Order');
    });

    it('should export X12 004010 850 as YAML — contains title', async () => {
      const schema = await container.exportSchemaCommand.execute({
        standard: 'X12',
        version: '004010',
        message: '850',
        format: 'yml',
      });

      expect(typeof schema).toBe('string');
      expect(schema.length).toBeGreaterThan(0);
      expect(schema).toContain('Purchase Order');
    });
  });
});



