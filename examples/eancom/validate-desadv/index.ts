/**
 * Example: Validate EANCOM 2002 DESADV (Despatch Advice)
 *
 * Demonstrates envelope validation of an EANCOM message —
 * once with a correct envelope and once with a UNB/UNZ mismatch.
 *
 * Run: npx tsx examples/eancom/validate-desadv/index.ts
 */

import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
  EdifactValidationServiceBuilder,
} from '@ediflow/edifact';
import {
  EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement,
} from '@ediflow/core';

const comp = (value: string | undefined, idx: number): string =>
  value?.split(':')[idx] ?? '';

// ─── EANCOM 2002 DESADV ───────────────────────────────────────────────────────
const EANCOM_DESADV = [
  "UNB+UNOC:3+SUPPLIER:14+BUYER:14+260503:0800+1'",
  "UNH+1+DESADV:D:02B:UN:EAN008'",
  "BGM+351+ASN-2026-001+9'",
  "DTM+137:20260503:102'",
  "DTM+11:20260504:102'",
  "RFF+ON:PO-2026-001'",
  "NAD+BY+5412345000013::9++ACME Retail+High Street 1+London++EC1A+GB'",
  "NAD+SU+4012345000014::9++Best Supplier GmbH+Industriestr. 5+Hamburg++20095+DE'",
  "TDT+20+TRUCK-001+30++DHL:160:ZZZ'",
  "LIN+1++5412345111116:EN'",
  "PIA+5+WIDGET-A:SA'",
  "IMD+F++:::Premium Widget Type A'",
  "QTY+12:100:PCE'",
  "NAD+UC+5412345000013::9'",
  "LIN+2++5412345222223:EN'",
  "PIA+5+GADGET-B:SA'",
  "IMD+F++:::Smart Gadget Type B'",
  "QTY+12:50:PCE'",
  "NAD+UC+5412345000013::9'",
  "UNS+S'",
  "CNT+2:2'",
  "UNT+22+1'",
  "UNZ+1+1'",
].join('');

const parser    = new EdifactMessageParser(
  new EdifactDelimiterDetector(), new EdifactTokenizer(), new EdifactSegmentParser(),
);
const validator = EdifactValidationServiceBuilder.forEDIFACT();

console.log('╔══════════════════════════════════════════╗');
console.log('║  EDIFlow — Validate EANCOM DESADV Example║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

// ─── Parse ────────────────────────────────────────────────────────────────────
console.log('─── Parse DESADV ────────────────────────────────────────────');
const message = parser.parse(EANCOM_DESADV);
const bgm     = message.segments.find(s => s.tag === 'BGM');
const dtms    = message.segments.filter(s => s.tag === 'DTM');
const buyer   = message.segments.find(s => s.tag === 'NAD' && s.elements[0]?.value === 'BY');
const seller  = message.segments.find(s => s.tag === 'NAD' && s.elements[0]?.value === 'SU');
const lins    = message.segments.filter(s => s.tag === 'LIN');

const getDate = (qual: string): string => {
  const dtm = dtms.find(d => comp(d.elements[0]?.value, 0) === qual);
  const raw  = comp(dtm?.elements[0]?.value, 1);
  return raw?.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
};

console.log(`  Standard:       ${message.standard}`);
console.log(`  Type:           ${message.messageType.value} (Despatch Advice)`);
console.log(`  Version:        ${message.version.value}`);
console.log(`  Segments:       ${message.segments.length}`);
console.log(`  ASN Number:     ${bgm?.elements[1]?.value}`);
console.log(`  Despatch Date:  ${getDate('137')}`);
console.log(`  Supplier GLN:   ${comp(seller?.elements[1]?.value, 0)}`);
console.log(`  Buyer GLN:      ${comp(buyer?.elements[1]?.value, 0)}`);
console.log(`  Line Items:     ${lins.length}`);
console.log('');

// ─── Validate: Correct Envelope ───────────────────────────────────────────────
console.log('─── Validate: Correct Envelope ──────────────────────────────');
const validResult = validator.validate(message);
console.log(`  Result:   ${validResult.isValid ? '✅ VALID' : '❌ INVALID'}`);
console.log(`  Errors:   ${validResult.errors.length}`);
if (validResult.isValid) {
  console.log('  → Message passes all EDIFACT structure validation rules');
}
console.log('');

// ─── Validate: Missing UNB (invalid: another segment is first) ────────────────
console.log('─── Validate: Missing UNB (BGM first) ───────────────────────');
const invalidMsg = new EDIMessage('invalid-desadv', Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.02B'), new MessageType(Standard.EDIFACT, 'DESADV'));
invalidMsg.addSegment(new EDISegment('BGM', [new EDIElement('351'), new EDIElement('ASN-2026-001')]));
invalidMsg.addSegment(new EDISegment('UNT', [new EDIElement('2'), new EDIElement('1')]));
invalidMsg.addSegment(new EDISegment('UNZ', [new EDIElement('1'), new EDIElement('1')]));

const invalidResult = validator.validate(invalidMsg);
console.log(`  Result:   ${invalidResult.isValid ? '✅ VALID' : '❌ INVALID'}`);
console.log(`  Errors:   ${invalidResult.errors.length}`);
for (const e of invalidResult.errors) {
  console.log(`    ⚠  [${e.code}] ${e.message}`);
}
console.log('');
console.log('✅ Validate EANCOM DESADV example complete!');


