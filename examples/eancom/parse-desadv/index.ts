/**
 * Example: Parse EANCOM 2002 DESADV (Despatch Advice / ASN)
 *
 * EANCOM is GS1's industry-specific subset of EDIFACT.
 * Key difference: uses GLN (Global Location Numbers) and EAN-13/GTIN product codes.
 *
 * Run: npx tsx examples/eancom/parse-desadv/index.ts
 */

import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
} from '@ediflow/edifact';

const comp = (value: string | undefined, idx: number): string =>
  value?.split(':')[idx] ?? '';

// ─── EANCOM 2002 DESADV ───────────────────────────────────────────────────────
// EANCOM uses:
//   - GLN (Global Location Number, :9) for party identification
//   - EAN-13 / GTIN (:EN) for product identification
//   - message reference: DESADV:D:02B:UN:EAN008
const EANCOM_DESADV = [
  "UNB+UNOC:3+SUPPLIER:14+BUYER:14+260503:0800+1'",
  "UNH+1+DESADV:D:02B:UN:EAN008'",
  "BGM+351+ASN-2026-001+9'",
  "DTM+137:20260503:102'",         // 137 = Document/message date
  "DTM+11:20260504:102'",          // 11  = Estimated delivery
  "RFF+ON:PO-2026-001'",
  "NAD+BY+5412345000013::9++ACME Retail+High Street 1+London++EC1A+GB'",
  "NAD+SU+4012345000014::9++Best Supplier GmbH+Industriestr. 5+Hamburg++20095+DE'",
  "TDT+20+TRUCK-001+30++DHL:160:ZZZ'",
  "CPS+1'",
  "PAC+2++CT'",
  "MEA+AAE+AAB+KGM:25'",
  "QTY+12:2:PCE'",
  "LIN+1++5412345111116:EN'",      // EAN-13 barcode
  "PIA+5+WIDGET-A:SA'",
  "IMD+F++:::Premium Widget Type A'",
  "QTY+12:100:PCE'",
  "NAD+UC+5412345000013::9'",
  "LIN+2++5412345222223:EN'",      // EAN-13 barcode
  "PIA+5+GADGET-B:SA'",
  "IMD+F++:::Smart Gadget Type B'",
  "QTY+12:50:PCE'",
  "NAD+UC+5412345000013::9'",
  "UNS+S'",
  "CNT+2:2'",
  "UNT+25+1'",
  "UNZ+1+1'",
].join('');

// ─── Parse ────────────────────────────────────────────────────────────────────
const parser = new EdifactMessageParser(
  new EdifactDelimiterDetector(), new EdifactTokenizer(), new EdifactSegmentParser(),
);

const message = parser.parse(EANCOM_DESADV);

const bgm    = message.segments.find(s => s.tag === 'BGM');
const dtms   = message.segments.filter(s => s.tag === 'DTM');
const rff    = message.segments.find(s => s.tag === 'RFF');
const buyer  = message.segments.find(s => s.tag === 'NAD' && s.elements[0]?.value === 'BY');
const seller = message.segments.find(s => s.tag === 'NAD' && s.elements[0]?.value === 'SU');
const tdt    = message.segments.find(s => s.tag === 'TDT');
const pac    = message.segments.find(s => s.tag === 'PAC');
const lins   = message.segments.filter(s => s.tag === 'LIN');
const pias   = message.segments.filter(s => s.tag === 'PIA');
const imds   = message.segments.filter(s => s.tag === 'IMD');

// Find the QTY+12 (despatch qty) that follows each LIN — skip the PAC-level QTY
const allSegs = message.segments;
const lineQtys: Array<typeof allSegs[0]> = [];
let inLine = false;
for (const seg of allSegs) {
  if (seg.tag === 'LIN') { inLine = true; continue; }
  if (inLine && seg.tag === 'QTY' && comp(seg.elements[0]?.value, 0) === '12') {
    lineQtys.push(seg);
    inLine = false;
  }
}

const getDate = (qual: string): string => {
  const dtm = dtms.find(d => comp(d.elements[0]?.value, 0) === qual);
  const raw  = comp(dtm?.elements[0]?.value, 1);
  return raw?.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
};

console.log('╔══════════════════════════════════════════╗');
console.log('║  EDIFlow — Parse EANCOM DESADV Example   ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');
console.log('📋 Message Info');
console.log(`  Standard:        ${message.standard}`);
console.log(`  Type:            ${message.messageType.value} (Despatch Advice)`);
console.log(`  Version:         ${message.version.value}`);
console.log(`  Segments:        ${message.segments.length}`);
console.log('');
console.log('📦 Shipment Header');
console.log(`  ASN Number:      ${bgm?.elements[1]?.value}`);
console.log(`  Despatch Date:   ${getDate('137')}`);
console.log(`  Est. Delivery:   ${getDate('11')}`);
console.log(`  PO Reference:    ${comp(rff?.elements[0]?.value, 1)}`);
console.log('');
console.log('🏢 Parties (GLN — Global Location Number)');
console.log(`  Buyer:           ${buyer?.elements[3]?.value}`);
console.log(`  Buyer GLN:       ${comp(buyer?.elements[1]?.value, 0)}`);
console.log(`  Buyer Address:   ${buyer?.elements[5]?.value}, ${buyer?.elements[6]?.value}`);
console.log(`  Supplier:        ${seller?.elements[3]?.value}`);
console.log(`  Supplier GLN:    ${comp(seller?.elements[1]?.value, 0)}`);
console.log(`  Supplier Address:${seller?.elements[5]?.value}, ${seller?.elements[6]?.value}`);
console.log('');
console.log('🚚 Transport');
console.log(`  Carrier:         ${comp(tdt?.elements[4]?.value, 0)}`);
console.log(`  Mode:            ${tdt?.elements[2]?.value === '30' ? 'Road (30)' : tdt?.elements[2]?.value}`);
console.log(`  Vehicle Ref:     ${tdt?.elements[1]?.value}`);
console.log(`  Packages:        ${pac?.elements[0]?.value} cartons`);
console.log('');
console.log('📋 Line Items (EAN-13 product codes)');
let totalItems = 0;
for (let i = 0; i < lins.length; i++) {
  const ean  = comp(lins[i]?.elements[2]?.value, 0);
  const sku  = comp(pias[i]?.elements[1]?.value, 0);
  const desc = imds[i]?.elements[3]?.value?.split(':')[3] ?? '';
  const qty  = comp(lineQtys[i]?.elements[0]?.value, 1);
  const uom  = comp(lineQtys[i]?.elements[0]?.value, 2);
  totalItems += parseInt(qty, 10);
  console.log(`  Line ${i + 1}: ${sku.padEnd(10)} EAN: ${ean}  ${qty.padStart(3)} ${uom}  ${desc}`);
}
console.log('');
console.log(`  Total Items:     ${totalItems} pcs across ${lins.length} lines`);
console.log('');
console.log('✅ Parse EANCOM DESADV complete!');



