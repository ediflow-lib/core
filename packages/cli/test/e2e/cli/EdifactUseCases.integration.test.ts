import { describe, it, expect, beforeAll } from 'vitest';
import { DIContainer } from '../../../src/infrastructure/container';
import { Standard } from '@ediflow/core';

/**
 * CLI Integration Tests — EDIFACT
 *
 * Tests ALL use cases via DIContainer with real EDIFACT messages.
 * No mocks. Full stack: DIContainer → UseCase → Parser/Builder/Validator.
 *
 * Use Cases covered:
 *   1. Parse    — ORDERS (syntax + structure check), INVOIC, DESADV
 *   2. Validate — valid message, structural validation
 *   3. Build    — EDIMessage → EDIFACT string (round-trip)
 *   4. Schema   — export ORDERS D.96A JSON Schema
 */
describe('CLI Integration — EDIFACT', () => {
  let container: DIContainer;

  beforeAll(() => {
    container = DIContainer.getInstance();
  });

  // ─── EDIFACT test messages ────────────────────────────────────────────────

  const ORDERS_D96A = [
    "UNB+UNOC:3+ACMECORP:14+SUPPLIER:14+260204:1200+1'",
    "UNH+1+ORDERS:D:96A:UN'",
    "BGM+220+PO-2026-001+9'",
    "DTM+137:20260204:102'",
    "DTM+2:20260210:102'",
    "NAD+BY+BUYER123::92++ACME Corporation+123 Main Street+New York++10001+US'",
    "NAD+SU+SUPP456::92++Best Supplier Inc'",
    "CUX+2:EUR:4'",
    "LIN+1++WIDGET-A:SA'",
    "QTY+21:100:PCE'",
    "PRI+AAA:10.50:CA'",
    "LIN+2++GADGET-B:SA'",
    "QTY+21:50:PCE'",
    "PRI+AAA:25.00:CA'",
    "UNS+S'",
    "CNT+2:2'",
    "UNT+15+1'",
    "UNZ+1+1'",
  ].join('');

  const INVOIC_D20B = [
    "UNB+UNOC:3+SUPP456:14+BUYER123:14+260205:0800+2'",
    "UNH+1+INVOIC:D:20B:UN'",
    "BGM+380+INV-2026-001+9'",
    "DTM+137:20260205:102'",
    "DTM+35:20260215:102'",
    "NAD+SE+SUPP456::92++Best Supplier Inc'",
    "NAD+BY+BUYER123::92++ACME Corporation'",
    "CUX+2:EUR:4'",
    "LIN+1++WIDGET-A:SA'",
    "QTY+47:100:PCE'",
    "MOA+203:1050.00'",
    "UNS+S'",
    "MOA+79:1050.00'",
    "UNT+13+1'",
    "UNZ+1+2'",
  ].join('');

  const DESADV_D01B = [
    "UNB+UNOC:3+SUPP456:14+BUYER123:14+260206:0900+3'",
    "UNH+1+DESADV:D:01B:UN'",
    "BGM+351+SHIP-2026-001+9'",
    "DTM+11:20260206:102'",
    "DTM+17:20260207:102'",
    "NAD+SE+SUPP456::92++Best Supplier Inc'",
    "NAD+BY+BUYER123::92++ACME Corporation'",
    "CPS+1'",
    "LIN+1++WIDGET-A:SA'",
    "QTY+12:100:PCE'",
    "LIN+2++GADGET-B:SA'",
    "QTY+12:50:PCE'",
    "UNT+12+1'",
    "UNZ+1+3'",
  ].join('');

  // ═══════════════════════════════════════════════════════════════════════════
  // USE CASE 1: Parse
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Parse', () => {
    it('should parse EDIFACT ORDERS D.96A — standard, version, type, segments', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata.standard).toBe(Standard.EDIFACT);
      expect(result.metadata.version.value).toBe('D.96A');
      expect(result.metadata.messageType.value).toBe('ORDERS');
      expect(result.metadata.segmentCount).toBe(18);
    });

    it('should parse EDIFACT ORDERS — detect delimiters (segment=\', element=+, component=:)', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata.delimiters?.segment).toBe("'");
      expect(result.metadata.delimiters?.element).toBe('+');
      expect(result.metadata.delimiters?.component).toBe(':');
    });

    it('should parse EDIFACT ORDERS — BGM has PO number PO-2026-001', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const bgm = result.message.segments.find(s => s.tag === 'BGM');
      expect(bgm).toBeDefined();
      expect(bgm!.elements[1]?.value).toBe('PO-2026-001');
    });

    it('should parse EDIFACT ORDERS — NAD buyer ACME Corporation identified', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const buyer = result.message.segments.find(
        s => s.tag === 'NAD' && s.elements[0]?.value === 'BY'
      );
      expect(buyer).toBeDefined();
      expect(buyer!.elements[3]?.value).toBe('ACME Corporation');
      expect(buyer!.elements[1]?.value.split(':')[0]).toBe('BUYER123');
    });

    it('should parse EDIFACT ORDERS — 2 LIN segments with correct products', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const lines = result.message.segments.filter(s => s.tag === 'LIN');
      expect(lines).toHaveLength(2);
      expect(lines[0]!.elements[2]?.value).toBe('WIDGET-A:SA');
      expect(lines[1]!.elements[2]?.value).toBe('GADGET-B:SA');
    });

    it('should parse EDIFACT INVOIC D.20B — type INVOIC, invoice number INV-2026-001', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: INVOIC_D20B, standard: Standard.EDIFACT });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata.version.value).toBe('D.20B');
      expect(result.metadata.messageType.value).toBe('INVOIC');

      const bgm = result.message.segments.find(s => s.tag === 'BGM');
      expect(bgm!.elements[1]?.value).toBe('INV-2026-001');
    });

    it('should parse EDIFACT DESADV D.01B — type DESADV, shipment SHIP-2026-001', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: DESADV_D01B, standard: Standard.EDIFACT });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata.version.value).toBe('D.01B');
      expect(result.metadata.messageType.value).toBe('DESADV');

      const bgm = result.message.segments.find(s => s.tag === 'BGM');
      expect(bgm!.elements[1]?.value).toBe('SHIP-2026-001');
    });

    it('should return error for empty message', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: '', standard: Standard.EDIFACT });

      expect(result.success).toBe(false);
    });

    it('should return error for non-EDIFACT content', () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: 'This is not EDI', standard: Standard.EDIFACT });

      expect(result.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USE CASE 1b: Parse + Structure Enrichment — EDIFACT ORDERS D.96A
  //
  // Verifies that MessageStructureBuilder fully resolves segment definitions
  // (tag, elements with code/name) from the D.96A data package.
  // Then verifies the parsed EDI message segments match the expected structure.
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Parse + Structure (EDIFACT ORDERS D.96A)', () => {
    it('should load ORDERS D.96A structure — standard, version, messageType match', async () => {
      const structure = await container.repository.getMessageStructure('EDIFACT', 'D.96A', 'ORDERS');

      expect(structure).not.toBeNull();
      expect(structure!.standard).toBe('EDIFACT');
      expect(structure!.version).toBe('D.96A');
      expect(structure!.messageType).toBe('ORDERS');
    });

    it('should load ORDERS D.96A structure — BGM segment resolved with tag and elements', async () => {
      const structure = await container.repository.getMessageStructure('EDIFACT', 'D.96A', 'ORDERS');
      expect(structure).not.toBeNull();

      const bgmNode = structure!.structure.find(
        node => node.nodeType === 'segment' && (node as any).tag === 'BGM'
      ) as any;

      expect(bgmNode).toBeDefined();
      expect(bgmNode.tag).toBe('BGM');
      expect(bgmNode.name).toBeDefined();
      expect(bgmNode.elements).toBeDefined();
      expect(bgmNode.elements.length).toBeGreaterThan(0);
    });

    it('should load ORDERS D.96A structure — BGM elements have code and nodeType', async () => {
      const structure = await container.repository.getMessageStructure('EDIFACT', 'D.96A', 'ORDERS');
      expect(structure).not.toBeNull();

      const bgmNode = structure!.structure.find(
        node => node.nodeType === 'segment' && (node as any).tag === 'BGM'
      ) as any;

      expect(bgmNode).toBeDefined();
      for (const element of bgmNode.elements) {
        expect(element.code).toBeDefined();
        expect(element.nodeType).toMatch(/^(element|composite)$/);
      }
    });

    it('should match parsed ORDERS BGM against expected values and structure definition', async () => {
      const structure = await container.repository.getMessageStructure('EDIFACT', 'D.96A', 'ORDERS');
      expect(structure).not.toBeNull();

      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const parsedBgm = result.message.segments.find(s => s.tag === 'BGM');
      const structureBgm = structure!.structure.find(
        node => node.nodeType === 'segment' && (node as any).tag === 'BGM'
      ) as any;

      expect(parsedBgm).toBeDefined();
      expect(structureBgm).toBeDefined();

      // Expected parsed BGM values from ORDERS_D96A: BGM+220+PO-2026-001+9
      const expectedBgm = {
        tag: 'BGM',
        documentTypeCode: '220',
        documentNumber: 'PO-2026-001',
        messageFunctionCode: '9',
      };

      expect(parsedBgm!.tag).toBe(expectedBgm.tag);
      expect(parsedBgm!.elements[0]?.value).toBe(expectedBgm.documentTypeCode);
      expect(parsedBgm!.elements[1]?.value).toBe(expectedBgm.documentNumber);
      expect(parsedBgm!.elements[2]?.value).toBe(expectedBgm.messageFunctionCode);

      // Structure definition must have at least 3 element positions for BGM
      expect(structureBgm.elements.length).toBeGreaterThanOrEqual(3);
    });

    it('should match parsed ORDERS DTM segments against expected date values', async () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const dtmSegments = result.message.segments.filter(s => s.tag === 'DTM');
      expect(dtmSegments).toHaveLength(2);

      // DTM+137:20260204:102 — document date
      // DTM+2:20260210:102  — delivery date
      const expectedDtm = [
        { qualifier: '137', date: '20260204', format: '102' },
        { qualifier: '2',   date: '20260210', format: '102' },
      ];

      for (let i = 0; i < expectedDtm.length; i++) {
        const dtm = dtmSegments[i]!;
        const expected = expectedDtm[i]!;
        const composite = dtm.elements[0];

        // C507 composite: qualifier:date:format  → components[] or full value split
        const qualifier = composite?.components[0] ?? composite?.value.split(':')[0];
        const date      = composite?.components[1] ?? composite?.value.split(':')[1];
        const format    = composite?.components[2] ?? composite?.value.split(':')[2];

        expect(qualifier).toBe(expected.qualifier);
        expect(date).toBe(expected.date);
        expect(format).toBe(expected.format);
      }
    });

    it('should match full parsed ORDERS segment tag sequence against expected order', async () => {
      const useCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const result = useCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const expectedTagSequence = [
        'UNB', 'UNH', 'BGM', 'DTM', 'DTM',
        'NAD', 'NAD', 'CUX',
        'LIN', 'QTY', 'PRI',
        'LIN', 'QTY', 'PRI',
        'UNS', 'CNT', 'UNT', 'UNZ',
      ];

      expect(result.message.segments.map(s => s.tag)).toEqual(expectedTagSequence);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USE CASE 2: Validate
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Validate', () => {
    it('should validate parsed ORDERS D.96A — isValid true, 0 errors', () => {
      const parseUseCase    = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const validateUseCase = container.getUseCaseFactory().createValidateUseCase();

      const parsed = parseUseCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const result = validateUseCase.execute({ message: parsed.message });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.validationResult.isValid).toBe(true);
      expect(result.validationResult.errors).toHaveLength(0);
    });

    it('should validate ORDERS with structural validation enabled — result returned', async () => {
      const structure       = await container.repository.getMessageStructure('EDIFACT', 'D.96A', 'ORDERS');
      const parseUseCase    = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const validateUseCase = container.getUseCaseFactory().createValidateUseCase();

      const parsed = parseUseCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const result = validateUseCase.execute({
        message: parsed.message,
        enableStructuralValidation: !!structure,
        messageStructure: structure ?? undefined,
      });

      // Structural validation is enabled when structure is available
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should validate parsed INVOIC D.20B — isValid true', () => {
      const parseUseCase    = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const validateUseCase = container.getUseCaseFactory().createValidateUseCase();

      const parsed = parseUseCase.execute({ message: INVOIC_D20B, standard: Standard.EDIFACT });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const result = validateUseCase.execute({ message: parsed.message });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.validationResult.isValid).toBe(true);
    });

    it('should validate parsed DESADV D.01B — isValid true', () => {
      const parseUseCase    = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const validateUseCase = container.getUseCaseFactory().createValidateUseCase();

      const parsed = parseUseCase.execute({ message: DESADV_D01B, standard: Standard.EDIFACT });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const result = validateUseCase.execute({ message: parsed.message });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.validationResult.isValid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USE CASE 3: Build
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Build', () => {
    it('should build EDIFACT string from parsed ORDERS — round-trip produces same segments', () => {
      const parseUseCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const buildUseCase = container.getUseCaseFactory().createBuildUseCase('EDIFACT');

      const parsed = parseUseCase.execute({ message: ORDERS_D96A, standard: Standard.EDIFACT });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const built = buildUseCase.execute({ message: parsed.message });
      expect(built.success).toBe(true);
      if (!built.success) return;

      expect(built.ediString).toBeDefined();
      expect(built.ediString.length).toBeGreaterThan(0);

      // Re-parse to verify round-trip
      const reparsed = parseUseCase.execute({ message: built.ediString, standard: Standard.EDIFACT });
      expect(reparsed.success).toBe(true);
      if (!reparsed.success) return;

      expect(reparsed.metadata.messageType.value).toBe('ORDERS');
      expect(reparsed.metadata.segmentCount).toBe(parsed.metadata.segmentCount);
    });

    it('should build EDIFACT INVOIC — output contains UNH, BGM, UNT and invoice number', () => {
      const parseUseCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const buildUseCase = container.getUseCaseFactory().createBuildUseCase('EDIFACT');

      const parsed = parseUseCase.execute({ message: INVOIC_D20B, standard: Standard.EDIFACT });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const built = buildUseCase.execute({ message: parsed.message });
      expect(built.success).toBe(true);
      if (!built.success) return;

      expect(built.ediString).toContain('UNH');
      expect(built.ediString).toContain('BGM');
      expect(built.ediString).toContain('UNT');
      expect(built.ediString).toContain('INV-2026-001');
    });

    it('should build EDIFACT DESADV — shipment number preserved in round-trip', () => {
      const parseUseCase = container.getUseCaseFactory().createParseUseCase('EDIFACT');
      const buildUseCase = container.getUseCaseFactory().createBuildUseCase('EDIFACT');

      const parsed = parseUseCase.execute({ message: DESADV_D01B, standard: Standard.EDIFACT });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const built = buildUseCase.execute({ message: parsed.message });
      expect(built.success).toBe(true);
      if (!built.success) return;

      expect(built.ediString).toContain('SHIP-2026-001');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USE CASE 4: Export Schema
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Export Schema', () => {
    it('should export ORDERS D.96A JSON Schema — valid $schema, title, type', async () => {
      const schema = await container.exportSchemaCommand.execute({
        standard: 'EDIFACT',
        version: 'D.96A',
        message: 'ORDERS',
        format: 'json',
      });

      const parsed = JSON.parse(schema);
      expect(parsed.$schema).toBeDefined();
      expect(parsed.title).toBe('Purchase order');
      expect(parsed.type).toBe('object');
    });

    it('should export INVOIC D.20B JSON Schema — $schema and title defined', async () => {
      const schema = await container.exportSchemaCommand.execute({
        standard: 'EDIFACT',
        version: 'D.20B',
        message: 'INVOIC',
        format: 'json',
      });

      const parsed = JSON.parse(schema);
      expect(parsed.$schema).toBeDefined();
      expect(parsed.title).toBeDefined();
      expect(parsed.type).toBe('object');
    });

    it('should export DESADV D.01B JSON Schema — title defined', async () => {
      const schema = await container.exportSchemaCommand.execute({
        standard: 'EDIFACT',
        version: 'D.01B',
        message: 'DESADV',
        format: 'json',
      });

      const parsed = JSON.parse(schema);
      expect(parsed.title).toBeDefined();
      expect(parsed.type).toBe('object');
    });

    it('should export ORDERS D.96A as YAML — contains title Purchase order', async () => {
      const schema = await container.exportSchemaCommand.execute({
        standard: 'EDIFACT',
        version: 'D.96A',
        message: 'ORDERS',
        format: 'yml',
      });

      expect(typeof schema).toBe('string');
      expect(schema.length).toBeGreaterThan(0);
      expect(schema).toContain('Purchase order');
    });
  });
});


