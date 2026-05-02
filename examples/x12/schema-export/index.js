/**
 * Example: X12 Schema Export
 *
 * Demonstrates how to load X12 message structure definitions
 * and export them as JSON Schema using the CLI or programmatically.
 *
 * Run: node examples/x12/schema-export/index.js
 */

'use strict';

const { FileBasedMessageStructureRepository } = require('@ediflow/infrastructure-shared');
const path = require('path');

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   EDIFlow — X12 Schema Export Example    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // ─── Setup Repository ──────────────────────────────────────────────────────
  const basePath   = path.resolve(__dirname, '../../../packages');
  const repository = new FileBasedMessageStructureRepository(basePath);

  // ─── Load X12 004010 850 Structure ─────────────────────────────────────────
  console.log('─── Loading X12 004010 850 Structure ────────────────────────');
  const structure = await repository.getMessageStructure('X12', '004010', '850');

  if (!structure) {
    console.log('  ⚠  Structure not found. Install @ediflow/x12-004010 first.');
    console.log('     npm install @ediflow/x12-004010');
    return;
  }

  console.log('  Standard:        ' + structure.standard);
  console.log('  Version:         ' + structure.version);
  console.log('  Message Type:    ' + structure.messageType);
  console.log('  Name:            ' + structure.name);
  console.log('  Segments:        ' + structure.structure.length);
  console.log('');

  // ─── Show Segment Details ──────────────────────────────────────────────────
  console.log('─── Key Segments ────────────────────────────────────────────');
  const keyTags = ['BEG', 'PO1', 'CTT', 'SE'];
  keyTags.forEach(tag => {
    const seg = structure.structure.find(n =>
      n.nodeType === 'segment' && n.tag === tag
    );
    if (seg && seg.nodeType === 'segment') {
      const mandatory = seg.mandatory ? '✓ mandatory' : '○ optional';
      const elements  = 'elements' in seg ? seg.elements?.length ?? 0 : 0;
      console.log('  ' + tag.padEnd(6) + ' ' + (seg.name ?? '').padEnd(30) + mandatory + '  (' + elements + ' elements)');
    }
  });

  // ─── Export as JSON Schema ─────────────────────────────────────────────────
  console.log('');
  console.log('─── JSON Schema Export (simplified) ────────────────────────');
  const begSeg = structure.structure.find(n => n.nodeType === 'segment' && n.tag === 'BEG');
  if (begSeg && begSeg.nodeType === 'segment' && begSeg.elements) {
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'X12 ' + structure.version + ' ' + structure.messageType + ' ' + structure.name,
      type: 'object',
      properties: {
        BEG: {
          type: 'object',
          description: begSeg.name,
          required: begSeg.mandatory,
          properties: {},
        },
      },
    };
    begSeg.elements.slice(0, 4).forEach(el => {
      if (el.nodeType === 'element') {
        schema.properties.BEG.properties[el.code] = {
          type: 'string',
          description: el.name,
          maxLength: el.maxLength,
        };
      }
    });
    console.log(JSON.stringify(schema, null, 2));
  }

  console.log('');
  console.log('─── CLI Usage ───────────────────────────────────────────────');
  console.log('  # Export schema via CLI:');
  console.log('  npx ediflow export-schema --standard X12 --version 004010 --type 850');
  console.log('');
  console.log('  # Export all X12 schemas:');
  console.log('  npx ediflow export-schema --standard X12 --all');
  console.log('');
  console.log('✅ Schema export example complete!');
}

main().catch(console.error);



