/**
 * Example: Parse Multiple X12 Transaction Sets
 *
 * Demonstrates parsing multiple transaction types in a single run:
 * 850 Purchase Order, 810 Invoice, 856 Ship Notice, 997 Acknowledgment.
 *
 * Run: node examples/x12/multi-message/index.js
 */

'use strict';

const {
  X12MessageParser,
  X12DelimiterDetector,
  X12SegmentParser,
  X12EnvelopeParser,
} = require('../../../packages/x12/dist/index.cjs');

// ─── Sample Messages ──────────────────────────────────────────────────────────

const MESSAGES = {
  '850': {
    name: 'Purchase Order',
    edi:
      'ISA*00*          *00*          *ZZ*BUYER          *ZZ*SELLER         *260204*0900*^*00501*000000010*0*P*>~' +
      'GS*PO*BUYER*SELLER*20260204*0900*10*X*005010~' +
      'ST*850*0001~' +
      'BEG*00*SA*PO-2026-001**20260204~' +
      'PO1*1*200*EA*5.99*PE*BP*ITEM-001~' +
      'PO1*2*100*EA*12.49*PE*BP*ITEM-002~' +
      'CTT*2~' +
      'SE*6*0001~' +
      'GE*1*10~' +
      'IEA*1*000000010~',
  },
  '810': {
    name: 'Invoice',
    edi:
      'ISA*00*          *00*          *ZZ*SELLER         *ZZ*BUYER          *260205*0800*^*00501*000000020*0*P*>~' +
      'GS*IN*SELLER*BUYER*20260205*0800*20*X*005010~' +
      'ST*810*0001~' +
      'BIG*20260205*INV-2026-001*20260204*PO-2026-001~' +
      'IT1*1*200*EA*5.99**BP*ITEM-001~' +
      'IT1*2*100*EA*12.49**BP*ITEM-002~' +
      'TDS*244800~' +
      'SE*6*0001~' +
      'GE*1*20~' +
      'IEA*1*000000020~',
  },
  '856': {
    name: 'Advance Ship Notice',
    edi:
      'ISA*00*          *00*          *ZZ*SELLER         *ZZ*BUYER          *260206*0700*^*00501*000000030*0*P*>~' +
      'GS*SH*SELLER*BUYER*20260206*0700*30*X*005010~' +
      'ST*856*0001~' +
      'BSN*00*SHIP-001*20260206*0700~' +
      'HL*1**S~' +
      'TD5**2*FEDEX~' +
      'HL*2*1*O~' +
      'PRF*PO-2026-001~' +
      'HL*3*2*P~' +
      'HL*4*3*I~' +
      'LIN**BP*ITEM-001~' +
      'SN1**200*EA~' +
      'SE*11*0001~' +
      'GE*1*30~' +
      'IEA*1*000000030~',
  },
  '997': {
    name: 'Functional Acknowledgment',
    edi:
      'ISA*00*          *00*          *ZZ*BUYER          *ZZ*SELLER         *260204*0901*^*00501*000000011*0*P*>~' +
      'GS*FA*BUYER*SELLER*20260204*0901*11*X*005010~' +
      'ST*997*0001~' +
      'AK1*PO*10~' +
      'AK2*850*0001~' +
      'AK5*A~' +
      'AK9*A*1*1*1~' +
      'SE*6*0001~' +
      'GE*1*11~' +
      'IEA*1*000000011~',
  },
};

// ─── Setup ────────────────────────────────────────────────────────────────────
const parser = new X12MessageParser(
  new X12DelimiterDetector(),
  new X12SegmentParser(),
  new X12EnvelopeParser()
);

console.log('╔══════════════════════════════════════════╗');
console.log('║  EDIFlow — Multi-Message X12 Example     ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

// ─── Parse Each Message ───────────────────────────────────────────────────────
const results = [];

for (const [type, { name, edi }] of Object.entries(MESSAGES)) {
  try {
    const message = parser.parse(edi);
    results.push({ type, name, message, error: null });
  } catch (err) {
    results.push({ type, name, message: null, error: err.message });
  }
}

// ─── Summary Table ───────────────────────────────────────────────────────────
console.log('─── Parsed Messages ────────────────────────────────────────');
console.log('  Type  Name                          Segments  Version  Status');
console.log('  ────  ────────────────────────────  ────────  ───────  ──────');
results.forEach(({ type, name, message, error }) => {
  if (message) {
    const segs = String(message.segments.length).padStart(8);
    const ver  = message.version.value.padEnd(7);
    console.log('  ' + type + '   ' + name.padEnd(30) + segs + '  ' + ver + '  ✅');
  } else {
    console.log('  ' + type + '   ' + name.padEnd(30) + '        -          ❌ ' + error);
  }
});

// ─── Detail: 850 Line Items ───────────────────────────────────────────────────
console.log('');
console.log('─── 850 Purchase Order Details ─────────────────────────────');
const po = results.find(r => r.type === '850')?.message;
if (po) {
  const beg  = po.segments.find(s => s.tag === 'BEG');
  const po1s = po.segments.filter(s => s.tag === 'PO1');
  console.log('  PO Number: ' + beg?.elements[2]?.value);
  let total = 0;
  po1s.forEach((po1, i) => {
    const qty = parseFloat(po1.elements[1]?.value || '0');
    const prc = parseFloat(po1.elements[3]?.value || '0');
    total += qty * prc;
    console.log('  Line ' + (i+1) + ':    ' + qty + ' EA × USD ' + prc.toFixed(2) + ' = USD ' + (qty * prc).toFixed(2));
  });
  console.log('  Total:     USD ' + total.toFixed(2));
}

// ─── Detail: 810 Invoice ─────────────────────────────────────────────────────
console.log('');
console.log('─── 810 Invoice Details ────────────────────────────────────');
const inv = results.find(r => r.type === '810')?.message;
if (inv) {
  const big = inv.segments.find(s => s.tag === 'BIG');
  const tds = inv.segments.find(s => s.tag === 'TDS');
  console.log('  Invoice #: ' + big?.elements[1]?.value);
  console.log('  PO Ref:    ' + big?.elements[3]?.value);
  const cents = parseInt(tds?.elements[0]?.value || '0', 10);
  console.log('  Total:     USD ' + (cents / 100).toFixed(2));
}

// ─── Detail: 997 Acknowledgment ──────────────────────────────────────────────
console.log('');
console.log('─── 997 Acknowledgment Details ─────────────────────────────');
const ack = results.find(r => r.type === '997')?.message;
if (ack) {
  const ak1 = ack.segments.find(s => s.tag === 'AK1');
  const ak9 = ack.segments.find(s => s.tag === 'AK9');
  const statusCode = ak9?.elements[0]?.value;
  const statusMap  = { A: 'Accepted', E: 'Accepted with errors', R: 'Rejected' };
  console.log('  Group:     ' + ak1?.elements[0]?.value + ' (Control: ' + ak1?.elements[1]?.value + ')');
  console.log('  Status:    ' + (statusMap[statusCode] || statusCode));
  console.log('  Accepted:  ' + ak9?.elements[2]?.value + '/' + ak9?.elements[1]?.value + ' transaction sets');
}

console.log('');
console.log('✅ Multi-message example complete!');

