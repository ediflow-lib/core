/**
 * Example: Parse X12 850 Purchase Order
 *
 * Run: npx tsx examples/x12/parse-850/index.ts
 */

import {
  X12MessageParser,
  X12DelimiterDetector,
  X12SegmentParser,
  X12EnvelopeParser,
} from '@ediflow/x12';

// ─── Sample X12 850 Purchase Order ───────────────────────────────────────────
const X12_850 = [
  'ISA*00*          *00*          *ZZ*ACMECORP       *ZZ*SUPPLIER       *260204*1030*^*00501*000000001*0*P*>~',
  'GS*PO*ACMECORP*SUPPLIER*20260204*1030*1*X*005010~',
  'ST*850*0001~',
  'BEG*00*SA*PO123456**20260204~',
  'REF*DP*DEPT001~',
  'DTM*002*20260210~',
  'N1*BY*ACME Corporation*92*BUYER123~',
  'N3*123 Main Street~',
  'N4*New York*NY*10001*US~',
  'N1*SE*Best Supplier Inc*92*SUPP456~',
  'PO1*1*100*EA*10.50*PE*BP*WIDGET-A~',
  'PID*F****Blue Widget 100-Pack~',
  'PO1*2*50*EA*25.00*PE*BP*GADGET-B~',
  'PID*F****Premium Gadget~',
  'CTT*2~',
  'SE*14*0001~',
  'GE*1*1~',
  'IEA*1*000000001~',
].join('');

// ─── Parse ────────────────────────────────────────────────────────────────────
const parser = new X12MessageParser(
  new X12DelimiterDetector(),
  new X12SegmentParser(),
  new X12EnvelopeParser(),
);

const message = parser.parse(X12_850);

const beg    = message.segments.find(s => s.tag === 'BEG');
const buyer  = message.segments.find(s => s.tag === 'N1' && s.elements[0]?.value === 'BY');
const seller = message.segments.find(s => s.tag === 'N1' && s.elements[0]?.value === 'SE');
const addr   = message.segments.find(s => s.tag === 'N3');
const city   = message.segments.find(s => s.tag === 'N4');
const po1s   = message.segments.filter(s => s.tag === 'PO1');
const ctt    = message.segments.find(s => s.tag === 'CTT');

const formatDate = (d?: string) =>
  d?.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;

console.log('╔══════════════════════════════════════════╗');
console.log('║     EDIFlow — Parse X12 850 Example      ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');
console.log('📋 Message Info');
console.log(`  Standard:      ${message.standard}`);
console.log(`  Type:          ${message.messageType.value} (Purchase Order)`);
console.log(`  Version:       ${message.version.value}`);
console.log(`  Segments:      ${message.segments.length}`);
console.log('');
console.log('📄 Order Header');
console.log(`  PO Number:     ${beg?.elements[2]?.value}`);
console.log(`  Order Date:    ${formatDate(beg?.elements[4]?.value)}`);
console.log(`  Purpose:       ${beg?.elements[0]?.value === '00' ? 'Original Order' : beg?.elements[0]?.value}`);
console.log(`  Order Type:    ${beg?.elements[1]?.value === 'SA' ? 'Stand-alone' : beg?.elements[1]?.value}`);
console.log('');
console.log('🏢 Buyer');
console.log(`  Name:          ${buyer?.elements[1]?.value}`);
console.log(`  ID:            ${buyer?.elements[3]?.value}`);
console.log(`  Address:       ${addr?.elements[0]?.value}`);
console.log(`  City/State:    ${city?.elements[0]?.value}, ${city?.elements[1]?.value} ${city?.elements[2]?.value}`);
console.log('');
console.log('🏭 Seller');
console.log(`  Name:          ${seller?.elements[1]?.value}`);
console.log(`  ID:            ${seller?.elements[3]?.value}`);
console.log('');
console.log('📦 Line Items');
let totalValue = 0;
for (const [i, po1] of po1s.entries()) {
  const qty   = parseFloat(po1.elements[1]?.value ?? '0');
  const price = parseFloat(po1.elements[3]?.value ?? '0');
  const uom   = po1.elements[2]?.value;
  const prod  = po1.elements[6]?.value;
  const line  = qty * price;
  totalValue += line;
  console.log(`  Line ${i + 1}:        ${qty} ${uom} × USD ${price.toFixed(2)} = USD ${line.toFixed(2)}  [${prod}]`);
}
console.log('');
console.log('💰 Summary');
console.log(`  Total Lines:   ${ctt?.elements[0]?.value}`);
console.log(`  Total Value:   USD ${totalValue.toFixed(2)}`);
console.log('');
console.log('✅ Parsing complete!');


