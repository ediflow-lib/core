/**
 * Example: Validate X12 837 Healthcare Claim
 *
 * Demonstrates how to validate an X12 837 healthcare claim message
 * using EDIFlow's built-in validation rules.
 *
 * Run: node examples/x12/validate-837/index.js
 */

'use strict';

const {
  X12MessageParser,
  X12DelimiterDetector,
  X12SegmentParser,
  X12EnvelopeParser,
  X12ValidationServiceBuilder,
} = require('../../../packages/x12/dist/index.cjs');
const {
  EDIMessage,
  Standard,
  Version,
  MessageType,
  EDISegment,
  EDIElement,
} = require('../../../packages/core/dist/index.cjs');

// ─── Sample X12 837 Healthcare Claim ─────────────────────────────────────────
const X12_837 =
  'ISA*00*          *00*          *ZZ*PROVIDER       *ZZ*PAYER          *260204*1030*^*00501*000000002*0*P*>~' +
  'GS*HC*PROVIDER*PAYER*20260204*1030*2*X*005010~' +
  'ST*837*0001~' +
  'BPR*I*1500.00~' +
  'NM1*IL*1*DOE*JOHN*A***MI*MEMB123456789~' +
  'NM1*85*2*CITY MEDICAL CENTER****XX*1234567890~' +
  'CLM*CLAIM001*1500.00***11:B:1*Y*A*Y*I~' +
  'DTP*472*RD8*20260101-20260131~' +
  'SV1*HC:99213*150.00*UN*1***1~' +
  'SV1*HC:85025*50.00*UN*1***1~' +
  'SE*9*0001~' +
  'GE*1*2~' +
  'IEA*1*000000002~';

// ─── Also test an INVALID message (wrong control numbers) ─────────────────────
function buildInvalidMessage() {
  const msg = new EDIMessage(
    'invalid-test',
    Standard.X12,
    new Version(Standard.X12, '005010'),
    new MessageType(Standard.X12, '837')
  );
  msg.addSegment(new EDISegment('ISA', [
    new EDIElement('00'), new EDIElement('          '),
    new EDIElement('00'), new EDIElement('          '),
    new EDIElement('ZZ'), new EDIElement('PROVIDER       '),
    new EDIElement('ZZ'), new EDIElement('PAYER          '),
    new EDIElement('260204'), new EDIElement('1030'),
    new EDIElement('^'), new EDIElement('00501'),
    new EDIElement('000000002'),
    new EDIElement('0'), new EDIElement('P'), new EDIElement('>'),
  ]));
  msg.addSegment(new EDISegment('ST', []));
  msg.addSegment(new EDISegment('SE', []));
  // IEA with WRONG control number
  msg.addSegment(new EDISegment('IEA', [
    new EDIElement('1'),
    new EDIElement('999999999'),  // ← mismatch!
  ]));
  return msg;
}

// ─── Setup ────────────────────────────────────────────────────────────────────
const parser    = new X12MessageParser(new X12DelimiterDetector(), new X12SegmentParser(), new X12EnvelopeParser());
const validator = X12ValidationServiceBuilder.forX12();

console.log('╔══════════════════════════════════════════╗');
console.log('║   EDIFlow — Validate X12 837 Example     ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

// ─── Test 1: Parse and inspect 837 ───────────────────────────────────────────
console.log('─── Test 1: Parse 837 Healthcare Claim ─────────────────────');
const message = parser.parse(X12_837);

const clm   = message.segments.find(s => s.tag === 'CLM');
const member = message.segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
const provider = message.segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === '85');
const sv1s  = message.segments.filter(s => s.tag === 'SV1');
const dtp   = message.segments.find(s => s.tag === 'DTP');

console.log('  Message Type:    ' + message.messageType.value + ' (Healthcare Claim)');
console.log('  Version:         ' + message.version.value);
console.log('  Claim ID:        ' + clm?.elements[0]?.value);
console.log('  Claim Amount:    USD ' + clm?.elements[1]?.value);
console.log('  Service Dates:   ' + dtp?.elements[2]?.value);
console.log('');
console.log('  Member:          ' + member?.elements[3]?.value + ', ' + member?.elements[2]?.value);
console.log('  Member ID:       ' + member?.elements[8]?.value);
console.log('');
console.log('  Provider:        ' + provider?.elements[2]?.value);
  console.log('  NPI:             ' + provider?.elements[7]?.value);
console.log('');
console.log('  Service Lines:');
sv1s.forEach((sv1, i) => {
  const proc = sv1.elements[0]?.value;
  const amt  = sv1.elements[1]?.value;
  const qty  = sv1.elements[3]?.value;
  console.log('    ' + (i + 1) + '. Procedure: ' + proc + ' | Amount: USD ' + amt + ' | Units: ' + qty);
});

// ─── Test 2: Validate valid message ──────────────────────────────────────────
console.log('');
console.log('─── Test 2: Validate With Envelope Segments ─────────────────');
const validMsg = new EDIMessage('valid-1', Standard.X12, new Version(Standard.X12, '005010'), new MessageType(Standard.X12, '837'));
validMsg.addSegment(new EDISegment('ISA', [
  new EDIElement('00'), new EDIElement('          '),
  new EDIElement('00'), new EDIElement('          '),
  new EDIElement('ZZ'), new EDIElement('PROVIDER       '),
  new EDIElement('ZZ'), new EDIElement('PAYER          '),
  new EDIElement('260204'), new EDIElement('1030'),
  new EDIElement('^'), new EDIElement('00501'),
  new EDIElement('000000002'),
  new EDIElement('0'), new EDIElement('P'), new EDIElement('>'),
]));
validMsg.addSegment(new EDISegment('ST', []));
validMsg.addSegment(new EDISegment('CLM', [new EDIElement('CLAIM001'), new EDIElement('1500.00')]));
validMsg.addSegment(new EDISegment('SE', []));
validMsg.addSegment(new EDISegment('IEA', [new EDIElement('1'), new EDIElement('000000002')]));

const validResult = validator.validate(validMsg);
console.log('  Result:          ' + (validResult.isValid ? '✅ VALID' : '❌ INVALID'));
console.log('  Errors:          ' + validResult.errors.length);

// ─── Test 3: Validate invalid message ────────────────────────────────────────
console.log('');
console.log('─── Test 3: Validate With Control Number Mismatch ───────────');
const invalidMsg    = buildInvalidMessage();
const invalidResult = validator.validate(invalidMsg);

console.log('  Result:          ' + (invalidResult.isValid ? '✅ VALID' : '❌ INVALID'));
console.log('  Errors:          ' + invalidResult.errors.length);
invalidResult.errors.forEach(e => {
  console.log('    ⚠  [' + e.code + '] ' + e.message);
});

console.log('');
console.log('✅ Validation example complete!');



