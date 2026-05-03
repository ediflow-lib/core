/**
 * Example: Validate HIPAA X12 835 Healthcare Payment / Remittance Advice
 *
 * Demonstrates parsing and envelope validation of a HIPAA-compliant 835
 * (Electronic Remittance Advice) with a correct and a broken envelope.
 *
 * Run: npx tsx examples/hipaa/validate-835/index.ts
 */

import {
  X12MessageParser,
  X12DelimiterDetector,
  X12SegmentParser,
  X12EnvelopeParser,
  X12ValidationServiceBuilder,
} from '@ediflow/x12';
import {
  EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement,
} from '@ediflow/core';

// ─── HIPAA 005010X221A1 835 — Healthcare Payment / Remittance Advice ─────────
// ISA must be exactly 106 chars; sender/receiver padded to 15 chars each.
const HIPAA_835 = [
  'ISA*00*          *00*          *ZZ*BCBS00001      *ZZ*PROVIDER       *260204*1000*^*00501*000000003*0*P*>~',
  'GS*HP*BCBS00001*PROVIDER*20260204*1000*3*X*005010~',
  'ST*835*0001~',
  'BPR*I*350.00*C*ACH*CCP*01*999999999*DA*12345678**1234567890*01*999999999*DA*987654321*20260204~',
  'TRN*1*835-2026-001*BCBS00001~',
  'DTM*405*20260204~',
  'N1*PR*BLUE CROSS BLUE SHIELD*XV*BCBS00001~',
  'N1*PE*CITY MEDICAL CENTER*XX*1234567890~',
  'CLP*CLAIM-2026-001*1*350.00*350.00**MC*CLAIM-REF-001*11~',
  'NM1*QC*1*DOE*JOHN*A***MI*BCBS123456789~',
  'SVC*HC:99213*150.00*150.00**1~',
  'DTM*472*20260201~',
  'CAS*CO*45*0~',
  'SVC*HC:87635*75.00*75.00**1~',
  'DTM*472*20260201~',
  'CAS*CO*45*0~',
  'SVC*HC:71046*125.00*125.00**1~',
  'DTM*472*20260201~',
  'CAS*CO*45*0~',
  'SE*18*0001~',
  'GE*1*3~',
  'IEA*1*000000003~',
].join('');

// ─── 835 with mismatched IEA control number ───────────────────────────────────
const HIPAA_835_BAD_IEA = HIPAA_835.replace('IEA*1*000000003~', 'IEA*1*999999999~');

const parser    = new X12MessageParser(new X12DelimiterDetector(), new X12SegmentParser(), new X12EnvelopeParser());
const validator = X12ValidationServiceBuilder.forX12();

console.log('╔══════════════════════════════════════════╗');
console.log('║  EDIFlow — Validate HIPAA 835 Example    ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

// ─── Parse 835 ────────────────────────────────────────────────────────────────
console.log('─── Parse 835 Remittance Advice ─────────────────────────────');
const message = parser.parse(HIPAA_835);

const bpr   = message.segments.find(s => s.tag === 'BPR');
const trn   = message.segments.find(s => s.tag === 'TRN');
const payer = message.segments.find(s => s.tag === 'N1' && s.elements[0]?.value === 'PR');
const payee = message.segments.find(s => s.tag === 'N1' && s.elements[0]?.value === 'PE');
const clp   = message.segments.find(s => s.tag === 'CLP');
const svcs  = message.segments.filter(s => s.tag === 'SVC');
const nm1   = message.segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'QC');

const totalPaid = svcs.reduce((sum, svc) => sum + parseFloat(svc.elements[2]?.value ?? '0'), 0);

console.log(`  Message Type:    ${message.messageType.value} (Payment/Remittance Advice)`);
console.log(`  Version:         ${message.version.value}`);
console.log(`  Check/EFT #:     ${trn?.elements[1]?.value}`);
console.log(`  Payment Date:    ${message.segments.find(s => s.tag === 'DTM')?.elements[1]?.value}`);
console.log(`  Payment Amt:     USD ${bpr?.elements[1]?.value}`);
console.log('');
console.log(`  Payer:           ${payer?.elements[1]?.value} (${payer?.elements[3]?.value})`);
console.log(`  Provider:        ${payee?.elements[1]?.value} (NPI: ${payee?.elements[3]?.value})`);
console.log('');
console.log(`  Claim ID:        ${clp?.elements[0]?.value}`);
console.log(`  Patient:         ${nm1?.elements[3]?.value}, ${nm1?.elements[2]?.value}`);
console.log(`  Claim Status:    ${clp?.elements[1]?.value === '1' ? 'Paid' : clp?.elements[1]?.value}`);
console.log(`  Billed:          USD ${clp?.elements[2]?.value}`);
console.log(`  Paid:            USD ${clp?.elements[3]?.value}`);
console.log('');
console.log('  Service Payments:');
svcs.forEach((svc, i) => {
  const proc = svc.elements[0]?.value?.split(':')[1];
  console.log(`    Line ${i + 1}: ${(proc ?? '').padEnd(8)} USD ${parseFloat(svc.elements[2]?.value ?? '0').toFixed(2)}`);
});
console.log(`  Total Paid:      USD ${totalPaid.toFixed(2)}`);
console.log('');

// ─── Validate: Correct Envelope ───────────────────────────────────────────────
console.log('─── Validate: Correct Envelope ──────────────────────────────');
const validMsg = new EDIMessage('valid-835', Standard.X12, new Version(Standard.X12, '005010'), new MessageType(Standard.X12, '835'));
validMsg.addSegment(new EDISegment('ISA', [
  new EDIElement('00'), new EDIElement('          '), new EDIElement('00'), new EDIElement('          '),
  new EDIElement('ZZ'), new EDIElement('BCBS00001      '), new EDIElement('ZZ'), new EDIElement('PROVIDER       '),
  new EDIElement('260204'), new EDIElement('1000'), new EDIElement('^'), new EDIElement('00501'),
  new EDIElement('000000003'), new EDIElement('0'), new EDIElement('P'), new EDIElement('>'),
]));
validMsg.addSegment(new EDISegment('ST',  []));
validMsg.addSegment(new EDISegment('BPR', [new EDIElement('I'), new EDIElement('350.00')]));
validMsg.addSegment(new EDISegment('TRN', [new EDIElement('1'), new EDIElement('835-2026-001')]));
validMsg.addSegment(new EDISegment('SE',  []));
validMsg.addSegment(new EDISegment('IEA', [new EDIElement('1'), new EDIElement('000000003')]));

const validResult = validator.validate(validMsg);
console.log(`  Result:   ${validResult.isValid ? '✅ VALID' : '❌ INVALID'}`);
console.log(`  Errors:   ${validResult.errors.length}`);
console.log('');

// ─── Validate: ISA/IEA Control Number Mismatch ────────────────────────────────
console.log('─── Validate: ISA/IEA Control Number Mismatch ───────────────');
const invalidMsg = new EDIMessage('invalid-835', Standard.X12, new Version(Standard.X12, '005010'), new MessageType(Standard.X12, '835'));
invalidMsg.addSegment(new EDISegment('ISA', [...Array(12).fill(new EDIElement('')), new EDIElement('000000003')]));
invalidMsg.addSegment(new EDISegment('IEA', [new EDIElement('1'), new EDIElement('999999999')]));

const invalidResult = validator.validate(invalidMsg);
console.log(`  Result:   ${invalidResult.isValid ? '✅ VALID' : '❌ INVALID'}`);
console.log(`  Errors:   ${invalidResult.errors.length}`);
for (const e of invalidResult.errors) {
  console.log(`    ⚠  [${e.code}] ${e.message}`);
}
console.log('');
console.log('✅ Validation HIPAA 835 example complete!');

