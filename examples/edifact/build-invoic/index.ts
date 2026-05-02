/**
 * Example: Build EDIFACT INVOIC (Invoice)
 *
 * Run: npx tsx examples/edifact/build-invoic/index.ts
 */

import {
  EdifactMessageBuilder,
  EdifactEnvelopeBuilder,
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
} from '../../../packages/edifact/dist/index.cjs';
import {
  EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement,
} from '../../../packages/core/dist/index.cjs';

const comp = (value: string | undefined, idx: number): string =>
  value?.split(':')[idx] ?? '';

// ─── 1. Create EDIMessage with invoice segments ───────────────────────────────
const invoiceMsg = new EDIMessage(
  '1', Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.20B'), new MessageType(Standard.EDIFACT, 'INVOIC'),
);
[
  new EDISegment('BGM', [new EDIElement('380'), new EDIElement('INV-2026-001'), new EDIElement('9')]),
  new EDISegment('DTM', [new EDIElement('137:20260205:102')]),
  new EDISegment('DTM', [new EDIElement('35:20260215:102')]),
  new EDISegment('NAD', [new EDIElement('SE'), new EDIElement('SUPP456::92'), new EDIElement(''), new EDIElement('Best Supplier Inc'), new EDIElement('456 Industrial Ave'), new EDIElement('Chicago'), new EDIElement(''), new EDIElement('60601'), new EDIElement('US')]),
  new EDISegment('NAD', [new EDIElement('BY'), new EDIElement('BUYER123::92'), new EDIElement(''), new EDIElement('ACME Corporation')]),
  new EDISegment('CUX', [new EDIElement('2:EUR:4')]),
  new EDISegment('LIN', [new EDIElement('1'), new EDIElement(''), new EDIElement('WIDGET-A:SA')]),
  new EDISegment('QTY', [new EDIElement('47:100:PCE')]),
  new EDISegment('MOA', [new EDIElement('203:1050.00')]),
  new EDISegment('PRI', [new EDIElement('INV:10.50:CA')]),
  new EDISegment('LIN', [new EDIElement('2'), new EDIElement(''), new EDIElement('GADGET-B:SA')]),
  new EDISegment('QTY', [new EDIElement('47:50:PCE')]),
  new EDISegment('MOA', [new EDIElement('203:1250.00')]),
  new EDISegment('PRI', [new EDIElement('INV:25.00:CA')]),
  new EDISegment('UNS', [new EDIElement('S')]),
  new EDISegment('MOA', [new EDIElement('79:2300.00')]),
  new EDISegment('CNT', [new EDIElement('2:2')]),
].forEach(seg => invoiceMsg.addSegment(seg));

// ─── 2. Wrap in UNH/UNT envelope ─────────────────────────────────────────────
const envelopeBuilder = new EdifactEnvelopeBuilder();
const wrappedMsg = envelopeBuilder.wrapMessage(invoiceMsg, {
  messageRef:  '1',
  messageType: new MessageType(Standard.EDIFACT, 'INVOIC'),
  version:     new Version(Standard.EDIFACT, 'D.20B'),
});

// ─── 3. Wrap in UNB/UNZ interchange ──────────────────────────────────────────
const interchange = envelopeBuilder.wrapInterchange([wrappedMsg], {
  sender:     'SUPP456:14',
  receiver:   'BUYER123:14',
  controlRef: '2',
  dateTime:   new Date('2026-02-05T08:00:00'),
});

// ─── 4. Build to EDIFACT string ───────────────────────────────────────────────
const builder       = new EdifactMessageBuilder();
const edifactString = builder.build(interchange);

console.log('╔══════════════════════════════════════════╗');
console.log('║  EDIFlow — Build EDIFACT INVOIC Example  ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');
console.log('─── Generated EDIFACT INVOIC ────────────────────────────────');
// Pretty-print: one segment per line
edifactString.split("'").filter(Boolean).forEach(s => console.log(s + "'"));

// ─── 5. Round-trip verification ───────────────────────────────────────────────
console.log('');
console.log('─── Round-Trip Verification ─────────────────────────────────');
const parser = new EdifactMessageParser(
  new EdifactDelimiterDetector(), new EdifactTokenizer(), new EdifactSegmentParser(),
);
const parsed   = parser.parse(edifactString);
const bgm      = parsed.segments.find(s => s.tag === 'BGM');
const lins     = parsed.segments.filter(s => s.tag === 'LIN');
const moaTotal = parsed.segments.filter(s => s.tag === 'MOA').find(m => comp(m.elements[0]?.value, 0) === '79');

console.log(`  Standard:      ${parsed.standard}`);
console.log(`  Type:          ${parsed.messageType.value} (Invoice)`);
console.log(`  Version:       ${parsed.version.value}`);
console.log(`  Invoice #:     ${bgm?.elements[1]?.value}`);
console.log(`  Line Items:    ${lins.length}`);
console.log(`  Total Amount:  EUR ${comp(moaTotal?.elements[0]?.value, 1)}`);
console.log('');
console.log('✅ Build + Round-trip complete!');



