/**
 * Example: Parse Multiple X12 Transaction Sets
 *
 * Run: npx tsx examples/x12/multi-message/index.ts
 */

import {
  X12MessageParser,
  X12DelimiterDetector,
  X12SegmentParser,
  X12EnvelopeParser,
} from '../../../packages/x12/dist/index.cjs';

const MESSAGES: Record<string, { name: string; edi: string }> = {
  '850': {
    name: 'Purchase Order',
    edi: [
      'ISA*00*          *00*          *ZZ*BUYER          *ZZ*SELLER         *260204*0900*^*00501*000000010*0*P*>~',
      'GS*PO*BUYER*SELLER*20260204*0900*10*X*005010~',
      'ST*850*0001~',
      'BEG*00*SA*PO-2026-001**20260204~',
      'PO1*1*200*EA*5.99*PE*BP*ITEM-001~',
      'PO1*2*100*EA*12.49*PE*BP*ITEM-002~',
      'CTT*2~',
      'SE*6*0001~',
      'GE*1*10~',
      'IEA*1*000000010~',
    ].join(''),
  },
  '810': {
    name: 'Invoice',
    edi: [
      'ISA*00*          *00*          *ZZ*SELLER         *ZZ*BUYER          *260205*0800*^*00501*000000020*0*P*>~',
      'GS*IN*SELLER*BUYER*20260205*0800*20*X*005010~',
      'ST*810*0001~',
      'BIG*20260205*INV-2026-001*20260204*PO-2026-001~',
      'IT1*1*200*EA*5.99**BP*ITEM-001~',
      'IT1*2*100*EA*12.49**BP*ITEM-002~',
      'TDS*244800~',
      'SE*6*0001~',
      'GE*1*20~',
      'IEA*1*000000020~',
    ].join(''),
  },
  '856': {
    name: 'Advance Ship Notice',
    edi: [
      'ISA*00*          *00*          *ZZ*SELLER         *ZZ*BUYER          *260206*0700*^*00501*000000030*0*P*>~',
      'GS*SH*SELLER*BUYER*20260206*0700*30*X*005010~',
      'ST*856*0001~',
      'BSN*00*SHIP-001*20260206*0700~',
      'HL*1**S~',
      'TD5**2*FEDEX~',
      'HL*2*1*O~',
      'PRF*PO-2026-001~',
      'HL*3*2*P~',
      'HL*4*3*I~',
      'LIN**BP*ITEM-001~',
      'SN1**200*EA~',
      'SE*11*0001~',
      'GE*1*30~',
      'IEA*1*000000030~',
    ].join(''),
  },
  '997': {
    name: 'Functional Acknowledgment',
    edi: [
      'ISA*00*          *00*          *ZZ*BUYER          *ZZ*SELLER         *260204*0901*^*00501*000000011*0*P*>~',
      'GS*FA*BUYER*SELLER*20260204*0901*11*X*005010~',
      'ST*997*0001~',
      'AK1*PO*10~',
      'AK2*850*0001~',
      'AK5*A~',
      'AK9*A*1*1*1~',
      'SE*6*0001~',
      'GE*1*11~',
      'IEA*1*000000011~',
    ].join(''),
  },
};

const parser = new X12MessageParser(
  new X12DelimiterDetector(),
  new X12SegmentParser(),
  new X12EnvelopeParser(),
);

console.log('╔══════════════════════════════════════════╗');
console.log('║  EDIFlow — Multi-Message X12 Example     ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

const results: Array<{ type: string; name: string; message: ReturnType<typeof parser.parse> | null; error: string | null }> = [];

for (const [type, { name, edi }] of Object.entries(MESSAGES)) {
  try {
    results.push({ type, name, message: parser.parse(edi), error: null });
  } catch (err) {
    results.push({ type, name, message: null, error: (err as Error).message });
  }
}

console.log('─── Parsed Messages ─────────────────────────────────────────');
console.log('  Type  Name                          Segments  Version  Status');
console.log('  ────  ────────────────────────────  ────────  ───────  ──────');
for (const { type, name, message, error } of results) {
  if (message) {
    console.log(`  ${type}   ${name.padEnd(30)}${String(message.segments.length).padStart(8)}  ${message.version.value.padEnd(7)}  ✅`);
  } else {
    console.log(`  ${type}   ${name.padEnd(30)}        -          ❌ ${error}`);
  }
}

const po = results.find(r => r.type === '850')?.message;
if (po) {
  console.log('');
  console.log('─── 850 Purchase Order Line Items ───────────────────────────');
  const beg  = po.segments.find(s => s.tag === 'BEG');
  const po1s = po.segments.filter(s => s.tag === 'PO1');
  console.log(`  PO Number: ${beg?.elements[2]?.value}`);
  let total = 0;
  for (const [i, po1] of po1s.entries()) {
    const qty = parseFloat(po1.elements[1]?.value ?? '0');
    const prc = parseFloat(po1.elements[3]?.value ?? '0');
    total += qty * prc;
    console.log(`  Line ${i + 1}:    ${qty} EA × USD ${prc.toFixed(2)} = USD ${(qty * prc).toFixed(2)}`);
  }
  console.log(`  Total:     USD ${total.toFixed(2)}`);
}

const inv = results.find(r => r.type === '810')?.message;
if (inv) {
  console.log('');
  console.log('─── 810 Invoice ─────────────────────────────────────────────');
  const big = inv.segments.find(s => s.tag === 'BIG');
  const tds = inv.segments.find(s => s.tag === 'TDS');
  console.log(`  Invoice #: ${big?.elements[1]?.value}`);
  console.log(`  PO Ref:    ${big?.elements[3]?.value}`);
  console.log(`  Total:     USD ${(parseInt(tds?.elements[0]?.value ?? '0', 10) / 100).toFixed(2)}`);
}

const ack = results.find(r => r.type === '997')?.message;
if (ack) {
  console.log('');
  console.log('─── 997 Acknowledgment ──────────────────────────────────────');
  const ak1 = ack.segments.find(s => s.tag === 'AK1');
  const ak9 = ack.segments.find(s => s.tag === 'AK9');
  const statusMap: Record<string, string> = { A: 'Accepted', E: 'Accepted with errors', R: 'Rejected' };
  console.log(`  Group:     ${ak1?.elements[0]?.value} (Control: ${ak1?.elements[1]?.value})`);
  console.log(`  Status:    ${statusMap[ak9?.elements[0]?.value ?? ''] ?? ak9?.elements[0]?.value}`);
  console.log(`  Accepted:  ${ak9?.elements[2]?.value}/${ak9?.elements[1]?.value} transaction sets`);
}
console.log('');
console.log('✅ Multi-message example complete!');


