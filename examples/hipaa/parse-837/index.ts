/**
 * Example: Parse HIPAA X12 837P Professional Claim
 *
 * Demonstrates parsing of a HIPAA-compliant 837P claim
 * with subscriber, provider, diagnosis codes, and service lines.
 *
 * Run: npx tsx examples/hipaa/parse-837/index.ts
 */

import {
  X12MessageParser,
  X12DelimiterDetector,
  X12SegmentParser,
  X12EnvelopeParser,
  X12ValidationServiceBuilder,
} from '@ediflow/x12';

// HIPAA 005010X222A1 837P — Professional Healthcare Claim
// NOTE: ISA needs sender/receiver exactly 15 chars each, component sep at position 104
const HIPAA_837P = [
  'ISA*00*          *00*          *ZZ*PROVIDER       *ZZ*CLEARINGHS     *260204*0900*^*00501*000000001*0*P*>~',
  'GS*HC*PROVIDER*CLEARINGHS*20260204*0900*1*X*005010~',
  'ST*837*0001~',
  // BPR: financial info
  'BPR*I*2050.00*C*ACH*CCP*01*999999999*DA*12345678**1234567890*01*999999999*DA*987654321*20260204~',
  // Submitter
  'NM1*41*2*CITY MEDICAL GROUP*****46*1234567890~',
  'PER*IC*BILLING OFFICE*TE*5551234567~',
  // Receiver
  'NM1*40*2*BLUE CROSS BLUE SHIELD*****46*9876543210~',
  // Subscriber (patient)
  'NM1*IL*1*DOE*JOHN*A***MI*BCBS123456789~',
  'N3*100 Patient Lane~',
  'N4*Springfield*IL*62701~',
  'DMG*D8*19800315*M~',
  // Payer
  'NM1*PR*2*BLUE CROSS BLUE SHIELD*****PI*BCBS00001~',
  // Claim
  'CLM*CLAIM-2026-001*2050.00***11:B:1*Y*A*Y*I~',
  'DTP*434*D8*20260201~',   // Onset date
  'DTP*472*D8*20260201~',   // Service date
  'HI*ABK:J20.9*BK:Z87.891~',  // Diagnosis: COVID-19, History of tobacco use
  // Rendering provider
  'NM1*82*1*SMITH*JANE***MD*1112223334~',
  // Service Line 1 (office visit)
  'LX*1~',
  'SV1*HC:99213:25*150.00*UN*1***1:2~',
  'DTP*472*D8*20260201~',
  // Service Line 2 (COVID test)
  'LX*2~',
  'SV1*HC:87635*75.00*UN*1***1~',
  'DTP*472*D8*20260201~',
  // Service Line 3 (chest X-ray)
  'LX*3~',
  'SV1*HC:71046*125.00*UN*1***1~',
  'DTP*472*D8*20260201~',
  'SE*25*0001~',
  'GE*1*1~',
  'IEA*1*000000001~',
].join('');

// ─── Parse ────────────────────────────────────────────────────────────────────
const parser = new X12MessageParser(
  new X12DelimiterDetector(),
  new X12SegmentParser(),
  new X12EnvelopeParser(),
);

const message = parser.parse(HIPAA_837P);

const clm      = message.segments.find(s => s.tag === 'CLM');
const bpr      = message.segments.find(s => s.tag === 'BPR');
const patient  = message.segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
const payer    = message.segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
const provider = message.segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === '82');
const addr     = message.segments.find(s => s.tag === 'N3');
const city     = message.segments.find(s => s.tag === 'N4');
const dmg      = message.segments.find(s => s.tag === 'DMG');
const hi       = message.segments.find(s => s.tag === 'HI');
const sv1s     = message.segments.filter(s => s.tag === 'SV1');
const dtpSvc   = message.segments.find(s => s.tag === 'DTP' && s.elements[0]?.value === '472');

const formatDate = (d?: string) =>
  d?.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d ?? '';

const diagCodes: Record<string, string> = {
  'J20.9':  'Acute bronchitis (COVID-19)',
  'Z87.891': 'History of tobacco use',
};

console.log('╔══════════════════════════════════════════╗');
console.log('║  EDIFlow — Parse HIPAA 837P Example      ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');
console.log('📋 Message Info');
console.log(`  Standard:        ${message.standard}`);
console.log(`  Type:            ${message.messageType.value} (Professional Claim)`);
console.log(`  Version:         ${message.version.value}`);
console.log(`  Segments:        ${message.segments.length}`);
console.log('');
console.log('🏥 Claim Header');
console.log(`  Claim ID:        ${clm?.elements[0]?.value}`);
console.log(`  Total Amount:    USD ${clm?.elements[1]?.value}`);
console.log(`  Service Date:    ${formatDate(dtpSvc?.elements[2]?.value)}`);
console.log(`  Place of Svc:    ${clm?.elements[4]?.value?.split(':')[0]} (Office)`);
console.log('');
console.log('👤 Patient / Subscriber');
console.log(`  Name:            ${patient?.elements[3]?.value}, ${patient?.elements[2]?.value}`);
console.log(`  Member ID:       ${patient?.elements[8]?.value}`);
console.log(`  DOB:             ${formatDate(dmg?.elements[1]?.value)}`);
console.log(`  Gender:          ${dmg?.elements[2]?.value === 'M' ? 'Male' : 'Female'}`);
console.log(`  Address:         ${addr?.elements[0]?.value}`);
console.log(`  City/State:      ${city?.elements[0]?.value}, ${city?.elements[1]?.value} ${city?.elements[2]?.value}`);
console.log('');
console.log('🏢 Payer');
console.log(`  Name:            ${payer?.elements[2]?.value}`);
console.log(`  Payer ID:        ${payer?.elements[8]?.value}`);
console.log('');
console.log('👨‍⚕️  Rendering Provider');
console.log(`  Name:            Dr. ${provider?.elements[2]?.value}, ${provider?.elements[3]?.value}`);
console.log(`  NPI:             ${provider?.elements[7]?.value}`);
console.log('');
console.log('🔬 Diagnosis Codes (ICD-10)');
const hiVal = hi?.elements[0]?.value ?? '';
const [, ...moreDx] = hi?.elements ?? [];
[hiVal, ...moreDx.map(e => e?.value)].filter(Boolean).forEach(code => {
  const [, icd] = code?.split(':') ?? [];
  if (icd) console.log(`  ${icd.padEnd(10)} ${diagCodes[icd] ?? 'See ICD-10 reference'}`);
});
console.log('');
console.log('💊 Service Lines');
const procNames: Record<string, string> = {
  '99213': 'Office Visit (Level 3)',
  '87635': 'COVID-19 Test (PCR)',
  '71046': 'Chest X-Ray (2 views)',
};
let totalBilled = 0;
sv1s.forEach((sv1, i) => {
  const procCode = sv1.elements[0]?.value?.split(':')[1];
  const amount   = parseFloat(sv1.elements[1]?.value ?? '0');
  totalBilled   += amount;
  const mod      = sv1.elements[0]?.value?.split(':')[2];
  const modStr   = mod ? ` [mod:${mod}]` : '';
  console.log(`  Line ${i + 1}: ${procCode?.padEnd(8)} ${(procNames[procCode ?? ''] ?? '').padEnd(26)} USD ${amount.toFixed(2)}${modStr}`);
});
console.log('');
console.log('💰 Claim Summary');
console.log(`  Lines:           ${sv1s.length}`);
console.log(`  Total Billed:    USD ${totalBilled.toFixed(2)}`);
console.log(`  BPR Amount:      USD ${bpr?.elements[1]?.value}`);
console.log('');
console.log('✅ HIPAA 837P parsing complete!');






