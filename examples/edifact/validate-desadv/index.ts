/**
 * Example: Validate EDIFACT DESADV (Despatch Advice / ASN)
 *
 * Run: npx tsx examples/edifact/validate-desadv/index.ts
 */

import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
  EdifactValidationServiceBuilder,
} from '@ediflow/edifact';

const comp = (value: string | undefined, idx: number): string =>
  value?.split(':')[idx] ?? '';

// EDIFACT D.01B DESADV — Despatch Advice (Advance Ship Notice)
const DESADV_D01B = [
  "UNB+UNOC:3+SUPPLIER:14+BUYER:14+260206:0700+3'",
  "UNH+1+DESADV:D:01B:UN'",
  "BGM+351+SHIP-2026-001+9'",       // 351 = Despatch advice
  "DTM+11:20260206:102'",             // 11 = Despatch date
  "DTM+17:20260207:102'",             // 17 = Estimated delivery
  "NAD+SE+SUPP456::92++Best Supplier Inc+456 Industrial Ave+Chicago++60601+US'",
  "NAD+BY+BUYER123::92++ACME Corporation'",
  "TDT+20++30+31::160:FEDEX++++FEDX-2026-9876543'",
  "LIN+1++WIDGET-A:SA'",
  "QTY+12:100:PCE'",                  // 12 = Despatch qty
  "RFF+ON:PO-2026-001'",
  "LIN+2++GADGET-B:SA'",
  "QTY+12:50:PCE'",
  "RFF+ON:PO-2026-001'",
  "UNS+S'",
  "CNT+2:2'",
  "UNT+15+1'",
  "UNZ+1+3'",
].join('');

const parser    = new EdifactMessageParser(
  new EdifactDelimiterDetector(), new EdifactTokenizer(), new EdifactSegmentParser(),
);
const validator  = EdifactValidationServiceBuilder.forEDIFACT();

console.log('╔══════════════════════════════════════════╗');
console.log('║ EDIFlow — Validate EDIFACT DESADV Example║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

// ─── Parse ────────────────────────────────────────────────────────────────────
console.log('─── Parse DESADV ────────────────────────────────────────────');
const message   = parser.parse(DESADV_D01B);
const bgm       = message.segments.find(s => s.tag === 'BGM');
const dtms      = message.segments.filter(s => s.tag === 'DTM');
const seller    = message.segments.find(s => s.tag === 'NAD' && s.elements[0]?.value === 'SE');
const buyer     = message.segments.find(s => s.tag === 'NAD' && s.elements[0]?.value === 'BY');
const tdt       = message.segments.find(s => s.tag === 'TDT');
const lins      = message.segments.filter(s => s.tag === 'LIN');
const qtys      = message.segments.filter(s => s.tag === 'QTY');

const getDate = (qual: string) => {
  const dtm = dtms.find(d => comp(d.elements[0]?.value, 0) === qual);
  const raw  = comp(dtm?.elements[0]?.value, 1);
  return raw?.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
};

console.log(`  Standard:       ${message.standard}`);
console.log(`  Type:           ${message.messageType.value} (Despatch Advice)`);
console.log(`  Version:        ${message.version.value}`);
console.log(`  Segments:       ${message.segments.length}`);
console.log('');
console.log(`  Shipment ID:    ${bgm?.elements[1]?.value}`);
console.log(`  Despatch Date:  ${getDate('11')}`);
console.log(`  Est. Delivery:  ${getDate('17')}`);
console.log('');
console.log(`  Supplier:       ${seller?.elements[3]?.value} (${comp(seller?.elements[1]?.value, 0)})`);
console.log(`  Buyer:          ${buyer?.elements[3]?.value} (${comp(buyer?.elements[1]?.value, 0)})`);
console.log('');
console.log(`  Carrier:        ${comp(tdt?.elements[8]?.value, 3)}`);
console.log(`  Tracking #:     ${tdt?.elements[9]?.value}`);
console.log('');
console.log('  Shipped Items:');
for (const [i] of lins.entries()) {
  const prod = comp(lins[i]?.elements[2]?.value, 0);
  const qty  = comp(qtys[i]?.elements[0]?.value, 1);
  const uom  = comp(qtys[i]?.elements[0]?.value, 2);
  console.log(`    ${i + 1}. ${prod.padEnd(12)}  ${qty} ${uom}`);
}

// ─── Validate ─────────────────────────────────────────────────────────────────
console.log('');
console.log('─── Validate ────────────────────────────────────────────────');
const result = validator.validate(message);
console.log(`  Result:         ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
console.log(`  Errors:         ${result.errors.length}`);
for (const e of result.errors) {
  console.log(`    ⚠  [${e.code}] ${e.message}`);
}
if (result.isValid) {
  console.log('  → Message passes all EDIFACT structure validation rules');
}
console.log('');
console.log('✅ Validate DESADV example complete!');


