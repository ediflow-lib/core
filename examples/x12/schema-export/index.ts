/**
 * Example: X12 Schema Export
 *
 * Demonstrates how to load X12 message structure definitions
 * and inspect / export them programmatically.
 *
 * Run: npx tsx examples/x12/schema-export/index.ts
 */

import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   EDIFlow — X12 Schema Export Example    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // ─── Setup Repository ──────────────────────────────────────────────────────
  const basePath   = resolve(__dirname, '../../../packages');
  const repository = new FileBasedMessageStructureRepository(basePath);

  // ─── Load X12 004010 850 Structure ─────────────────────────────────────────
  console.log('─── Loading X12 004010 850 Structure ────────────────────────');
  const structure = await repository.getMessageStructure('X12', '004010', '850');

  if (!structure) {
    console.log('  ⚠  Structure not found. Install @ediflow/x12-004010 first.');
    return;
  }

  console.log(`  Standard:        ${structure.standard}`);
  console.log(`  Version:         ${structure.version}`);
  console.log(`  Message Type:    ${structure.messageType}`);
  console.log(`  Name:            ${structure.name}`);
  console.log(`  Top-level nodes: ${structure.structure.length}`);
  console.log('');

  // ─── Show Key Segment Details ──────────────────────────────────────────────
  console.log('─── Key Segments ────────────────────────────────────────────');
  const keyTags = ['BEG', 'PO1', 'CTT', 'SE'];
  for (const tag of keyTags) {
    const seg = structure.structure.find(n => n.nodeType === 'segment' && n.tag === tag);
    if (seg && seg.nodeType === 'segment') {
      const mandatory = seg.mandatory ? '✓ mandatory' : '○ optional';
      const elements  = 'elements' in seg ? (seg.elements?.length ?? 0) : 0;
      console.log(`  ${tag.padEnd(6)} ${ (seg.name ?? '').padEnd(30)} ${mandatory}  (${elements} elements)`);
    }
  }

  // ─── Show BEG Element Definitions ─────────────────────────────────────────
  console.log('');
  console.log('─── BEG Element Definitions ─────────────────────────────────');
  const begSeg = structure.structure.find(n => n.nodeType === 'segment' && n.tag === 'BEG');
  if (begSeg && begSeg.nodeType === 'segment' && begSeg.elements) {
    begSeg.elements.forEach((el, i) => {
      if (el.nodeType === 'element') {
        const mand = el.mandatory ? 'M' : 'O';
        console.log(`  [${i}] ${el.code.padEnd(6)} "${el.name}"  (maxLength: ${el.maxLength ?? '?'}, ${mand})`);
      }
    });
  }

  // ─── Export as JSON Schema ─────────────────────────────────────────────────
  console.log('');
  console.log('─── JSON Schema Export (BEG segment) ───────────────────────');
  if (begSeg && begSeg.nodeType === 'segment' && begSeg.elements) {
    const properties: Record<string, unknown> = {};
    begSeg.elements.slice(0, 4).forEach(el => {
      if (el.nodeType === 'element') {
        properties[el.code] = {
          type: 'string',
          description: el.name,
          maxLength: el.maxLength,
        };
      }
    });
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: `X12 ${structure.version} ${structure.messageType} ${structure.name}`,
      type: 'object',
      properties: {
        BEG: {
          type: 'object',
          description: begSeg.name,
          required: begSeg.mandatory,
          properties,
        },
      },
    };
    console.log(JSON.stringify(schema, null, 2));
  }

  console.log('');
  console.log('─── CLI Usage ───────────────────────────────────────────────');
  console.log('  # Export schema via CLI:');
  console.log('  npx ediflow export-schema --standard X12 --version 004010 --type 850');
  console.log('');
  console.log('✅ Schema export example complete!');
}

main().catch(console.error);

