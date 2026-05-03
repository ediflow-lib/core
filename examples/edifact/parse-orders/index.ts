/**
 * Example: Parse EDIFACT ORDERS (Purchase Order)
 *
 * Demonstrates TWO levels of EDIFlow parsing:
 *
 * LEVEL 1 — Syntax Parsing (Low-Level)
 *   EdifactMessageParser → raw EDIMessage with generic segments/elements
 *   Other EDI libraries stop here.
 *
 * LEVEL 2 — Schema-Aware Parsing (High-Level) ← THE REAL POWER!
 *   FileBasedMessageStructureRepository loads the @ediflow/edifact-d96a
 *   schema and resolves segment definitions with named elements.
 *   → You know that BGM element[1] is "Document/message number"
 *   → You know that NAD C082 component[0] is "Party identifier"
 *
 * Run: npx tsx examples/edifact/parse-orders/index.ts
 */

import * as path from 'path';
import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
} from '@ediflow/edifact';
import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';

// ─── Sample EDIFACT D.96A ORDERS ─────────────────────────────────────────────
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

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  EDIFlow — Parse EDIFACT ORDERS Example  ║');
  console.log('╚══════════════════════════════════════════╝');

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 1: Syntax Parsing — raw EDIMessage
  // ───────────────────────────────────────────────────────────────────────────
  // Other libraries stop here. You get generic segments/elements and must
  // know by heart what elements[1].value means in a BGM segment.
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ LEVEL 1 — Syntax Parsing (raw EDIMessage)                   │');
  console.log('│ Low-level: you work with segments and element indices        │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  const edifactParser = new EdifactMessageParser(
    new EdifactDelimiterDetector(),
    new EdifactTokenizer(),
    new EdifactSegmentParser(),
  );

  const rawMessage = edifactParser.parse(ORDERS_D96A);

  console.log(`  Standard:   ${rawMessage.standard}`);
  console.log(`  Version:    ${rawMessage.version.value}`);
  console.log(`  Type:       ${rawMessage.messageType.value}`);
  console.log(`  Segments:   ${rawMessage.segments.length}`);
  console.log('');

  const bgmRaw   = rawMessage.segments.find(s => s.tag === 'BGM');
  const buyerRaw = rawMessage.segments.find(s => s.tag === 'NAD' && s.elements[0]?.value === 'BY');

  console.log('  Raw access (must know segment/element positions by heart):');
  console.log(`    PO Number:  bgm.elements[1].value               → "${bgmRaw?.elements[1]?.value}"`);
  console.log(`    Buyer Name: nad.elements[3].value               → "${buyerRaw?.elements[3]?.value}"`);
  console.log(`    Buyer ID:   nad.elements[1].value.split(':')[0]  → "${buyerRaw?.elements[1]?.value?.split(':')[0]}"`);
  console.log('');
  console.log('  ⚠️  Problem: What is elements[1]? elements[3]?');
  console.log('     You must look up the EDIFACT D.96A spec every time!');

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 2: Schema-Aware Parsing — resolved segment definitions
  // ───────────────────────────────────────────────────────────────────────────
  // FileBasedMessageStructureRepository loads the @ediflow/edifact-d96a
  // data package (segments.json, composites.json, elements.json) and
  // resolves the full ORDERS message structure with named element definitions.
  //
  // Now you know:
  //   BGM element[0] = "Document/message name, coded"  (maxLength: 3)
  //   BGM element[1] = "Document/message number"       (maxLength: 35)
  //   NAD C082       = "Party identification details"  (composite)
  //   NAD 3164       = "City name"                     (maxLength: 35)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│ LEVEL 2 — Schema-Aware Parsing (the real EDIFlow power!)    │');
  console.log('│ @ediflow/edifact-d96a → named element definitions           │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  const packagesPath = path.resolve(__dirname, '../../../packages');
  const repository   = new FileBasedMessageStructureRepository(packagesPath);

  const messageStructure = await repository.getMessageStructure('EDIFACT', 'D.96A', 'ORDERS');

  if (!messageStructure) {
    console.error('  ❌ Could not load ORDERS D.96A structure from edifact-d96a package');
    process.exit(1);
  }

  console.log(`  ✅ Schema loaded: "${messageStructure.name}"`);
  console.log(`     Standard: ${messageStructure.standard}   Version: ${messageStructure.version}   Type: ${messageStructure.messageType}`);
  console.log(`     Top-level nodes: ${messageStructure.structure.length} (segments + segment groups)\n`);

  // Resolve BGM segment definition from the schema
  const bgmStructure = messageStructure.structure.find(
    n => n.nodeType === 'segment' && n.tag === 'BGM'
  );

  if (bgmStructure && bgmStructure.nodeType === 'segment') {
    console.log('  BGM (Beginning of Message) — element definitions from D.96A schema:');
    bgmStructure.elements.forEach((el, idx) => {
      if (el.nodeType === 'element') {
        console.log(`    [${idx}] ${el.code.padEnd(6)} "${el.name}"  (maxLength: ${el.maxLength ?? '?'}, mandatory: ${el.mandatory})`);
      } else {
        console.log(`    [${idx}] ${el.code.padEnd(6)} "${el.name}"  (composite, mandatory: ${el.mandatory})`);
      }
    });
    console.log('');
    console.log('  ✅ Now you know: bgm.elements[1].value = "Document/message number" = PO number!');
  }

  // Resolve NAD segment definition
  const nadStructure = messageStructure.structure.find(
    n => n.nodeType === 'segment' && n.tag === 'NAD'
  );

  if (nadStructure && nadStructure.nodeType === 'segment') {
    console.log('\n  NAD (Name and Address) — element definitions from D.96A schema:');
    nadStructure.elements.forEach((el, idx) => {
      if (el.nodeType === 'element') {
        console.log(`    [${idx}] ${el.code.padEnd(6)} "${el.name}"  (maxLength: ${el.maxLength ?? '?'})`);
      } else {
        console.log(`    [${idx}] ${el.code.padEnd(6)} "${el.name}"  (composite)`);
        if (el.components) {
          el.components.slice(0, 3).forEach((c, ci) => {
            console.log(`         [${ci}] ${c.code.padEnd(6)} "${c.name}"  (maxLength: ${c.maxLength ?? '?'})`);
          });
        }
      }
    });
  }

  console.log('');
  console.log('  ─── raw vs. schema-aware access comparison ─────────────────');
  console.log('');
  console.log('  // ❌ Level 1 — raw, spec-dependent:');
  console.log(`  nadRaw.elements[1].value.split(":")[0]    // What is this? You need the spec!`);
  console.log(`  → "${buyerRaw?.elements[1]?.value?.split(':')[0]}"`);
  console.log('');
  console.log('  // ✅ Level 2 — schema-guided, self-documenting:');
  console.log('  // NAD element[1] = C082 "Party identification details"');
  console.log('  // C082 component[0] = 3039 "Party identifier" (maxLength: 35)');
  console.log(`  → "${buyerRaw?.elements[1]?.value?.split(':')[0]}"  (= Party identifier, known from D.96A schema)`);
  console.log('');
  console.log('─── Parsed Message Object (JSON) ────────────────────────────');
  console.log(JSON.stringify(rawMessage, null, 2));
  console.log('');
  console.log('✅ Done!');
}

main().catch(console.error);
