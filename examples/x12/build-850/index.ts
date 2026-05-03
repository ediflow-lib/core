/**
 * Example: Build X12 850 Purchase Order
 *
 * Run: npx tsx examples/x12/build-850/index.ts
 */

import {
  X12MessageBuilder,
  X12MessageParser,
  X12DelimiterDetector,
  X12SegmentParser,
  X12EnvelopeParser,
} from '@ediflow/x12';
import {
  EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement,
} from '@ediflow/core';

// ─── 1. Create EDIMessage with 850 segments ───────────────────────────────────
const purchaseOrder = new EDIMessage(
  '1', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'),
);
[
  new EDISegment('ST',  [new EDIElement('850'), new EDIElement('0001')]),
  new EDISegment('BEG', [new EDIElement('00'), new EDIElement('SA'), new EDIElement('PO-2026-001'), new EDIElement(''), new EDIElement('20260503')]),
  new EDISegment('REF', [new EDIElement('DP'), new EDIElement('DEPT001')]),
  new EDISegment('DTM', [new EDIElement('002'), new EDIElement('20260510')]),
  new EDISegment('N1',  [new EDIElement('BY'), new EDIElement('ACME Corporation'), new EDIElement('92'), new EDIElement('BUYER123')]),
  new EDISegment('N3',  [new EDIElement('123 Main Street')]),
  new EDISegment('N4',  [new EDIElement('New York'), new EDIElement('NY'), new EDIElement('10001'), new EDIElement('US')]),
  new EDISegment('N1',  [new EDIElement('SE'), new EDIElement('Best Supplier Inc'), new EDIElement('92'), new EDIElement('SUPP456')]),
  new EDISegment('PO1', [new EDIElement('1'), new EDIElement('100'), new EDIElement('EA'), new EDIElement('10.50'), new EDIElement('PE'), new EDIElement('BP'), new EDIElement('WIDGET-A')]),
  new EDISegment('PID', [new EDIElement('F'), new EDIElement(''), new EDIElement(''), new EDIElement(''), new EDIElement('Blue Widget 100-Pack')]),
  new EDISegment('PO1', [new EDIElement('2'), new EDIElement('50'), new EDIElement('EA'), new EDIElement('25.00'), new EDIElement('PE'), new EDIElement('BP'), new EDIElement('GADGET-B')]),
  new EDISegment('PID', [new EDIElement('F'), new EDIElement(''), new EDIElement(''), new EDIElement(''), new EDIElement('Premium Gadget')]),
  new EDISegment('CTT', [new EDIElement('2')]),
  new EDISegment('SE',  [new EDIElement('14'), new EDIElement('0001')]),
].forEach(seg => purchaseOrder.addSegment(seg));

// ─── 2. Build to X12 string ───────────────────────────────────────────────────
const builder   = new X12MessageBuilder();
const x12String = builder.build(purchaseOrder);

console.log('╔══════════════════════════════════════════╗');
console.log('║   EDIFlow — Build X12 850 PO Example     ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');
console.log('─── Generated X12 850 ───────────────────────────────────────');
// Pretty-print: one segment per line
x12String.split('~').filter(Boolean).forEach(s => console.log(s + '~'));

// ─── 3. Round-trip verification ───────────────────────────────────────────────
// Wrap with ISA/GS/GE/IEA envelope so the parser can detect delimiters.
// ISA is fixed-length (106 chars): sender/receiver IDs must be padded to 15 chars.
const envelope = [
  'ISA*00*          *00*          *ZZ*BUYER123       *ZZ*SUPP456        *260503*1200*^*00401*000000001*0*P*>~',
  'GS*PO*BUYER123*SUPP456*20260503*1200*1*X*004010~',
  x12String,
  'GE*1*1~',
  'IEA*1*000000001~',
].join('');

console.log('');
console.log('─── Round-Trip Verification ─────────────────────────────────');
const parser = new X12MessageParser(
  new X12DelimiterDetector(),
  new X12SegmentParser(),
  new X12EnvelopeParser(),
);
const parsed = parser.parse(envelope);

const beg    = parsed.segments.find(s => s.tag === 'BEG');
const po1s   = parsed.segments.filter(s => s.tag === 'PO1');
const ctt    = parsed.segments.find(s => s.tag === 'CTT');

let totalValue = 0;
for (const po1 of po1s) {
  const qty   = parseFloat(po1.elements[1]?.value ?? '0');
  const price = parseFloat(po1.elements[3]?.value ?? '0');
  totalValue += qty * price;
}

console.log(`  Standard:      ${parsed.standard}`);
console.log(`  Type:          ${parsed.messageType.value} (Purchase Order)`);
console.log(`  Version:       ${parsed.version.value}`);
console.log(`  PO Number:     ${beg?.elements[2]?.value}`);
console.log(`  Order Date:    ${beg?.elements[4]?.value}`);
console.log(`  Line Items:    ${ctt?.elements[0]?.value}`);
console.log(`  Total Value:   USD ${totalValue.toFixed(2)}`);
console.log('');
console.log('✅ Build + Round-trip complete!');




