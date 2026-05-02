/**
 * Example: Parse EDIFACT ORDERS (Purchase Order)
 *
 * Run: npx tsx examples/edifact/parse-orders/index.ts
 */

import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
} from '../../../packages/edifact/dist/index.cjs';

// Helper: split composite element value by ':'
const comp = (value: string | undefined, idx: number): string =>
  value?.split(':')[idx] ?? '';

// EDIFACT D.96A ORDERS — segment terminator: '   element separator: +
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

const parser = new EdifactMessageParser(
  new EdifactDelimiterDetector(),
  new EdifactTokenizer(),
  new EdifactSegmentParser(),
);

const message = parser.parse(ORDERS_D96A);

const bgm    = message.segments.find(s => s.tag === 'BGM');
const dtms   = message.segments.filter(s => s.tag === 'DTM');
const buyer  = message.segments.find(s => s.tag === 'NAD' && s.elements[0]?.value === 'BY');
const seller = message.segments.find(s => s.tag === 'NAD' && s.elements[0]?.value === 'SU');
const cux    = message.segments.find(s => s.tag === 'CUX');
const lins   = message.segments.filter(s => s.tag === 'LIN');
const qtys   = message.segments.filter(s => s.tag === 'QTY');
const pris   = message.segments.filter(s => s.tag === 'PRI');

const formatDate = (d?: string) =>
  d?.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d ?? '';

const getDate = (qual: string) => {
  const dtm = dtms.find(d => comp(d.elements[0]?.value, 0) === qual);
  return formatDate(comp(dtm?.elements[0]?.value, 1));
};

const currency = comp(cux?.elements[0]?.value, 1);

console.log('╔══════════════════════════════════════════╗');
console.log('║  EDIFlow — Parse EDIFACT ORDERS Example  ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');
console.log('📋 Message Info');
console.log(`  Standard:      ${message.standard}`);
console.log(`  Type:          ${message.messageType.value} (Purchase Order)`);
console.log(`  Version:       ${message.version.value}`);
console.log(`  Segments:      ${message.segments.length}`);
console.log('');
console.log('📄 Order Header');
console.log(`  PO Number:     ${bgm?.elements[1]?.value}`);
console.log(`  Doc Type:      220 (Standard Order)`);
console.log(`  Order Date:    ${getDate('137')}`);
console.log(`  Delivery Date: ${getDate('2')}`);
console.log(`  Currency:      ${currency}`);
console.log('');
console.log('🏢 Buyer (BY)');
console.log(`  ID:            ${comp(buyer?.elements[1]?.value, 0)}`);
console.log(`  Name:          ${buyer?.elements[3]?.value}`);
console.log(`  Address:       ${buyer?.elements[4]?.value}`);
console.log(`  City/Country:  ${buyer?.elements[5]?.value}, ${buyer?.elements[8]?.value}`);
console.log('');
console.log('🏭 Seller (SU)');
console.log(`  ID:            ${comp(seller?.elements[1]?.value, 0)}`);
console.log(`  Name:          ${seller?.elements[3]?.value}`);
console.log('');
console.log('📦 Line Items');
let totalValue = 0;
for (const [i] of lins.entries()) {
  const prod  = comp(lins[i]?.elements[2]?.value, 0);
  const qty   = parseFloat(comp(qtys[i]?.elements[0]?.value, 1));
  const uom   = comp(qtys[i]?.elements[0]?.value, 2);
  const price = parseFloat(comp(pris[i]?.elements[0]?.value, 1));
  const line  = qty * price;
  totalValue += line;
  console.log(`  Line ${i + 1}:        ${qty} ${uom} × ${currency} ${price.toFixed(2)} = ${currency} ${line.toFixed(2)}  [${prod}]`);
}
console.log('');
console.log('💰 Summary');
console.log(`  Total Lines:   ${lins.length}`);
console.log(`  Total Value:   ${currency} ${totalValue.toFixed(2)}`);
console.log('');
console.log('✅ Parsing complete!');
