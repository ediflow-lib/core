/**
 * Data Package Validation Script
 *
 * Validates ALL data packages:
 * 1. Zod schema validation (structural correctness of JSON files)
 * 2. Referential integrity (all segmentRef/elementCode/compositeCode resolve)
 *    — Issues are aggregated: missing definitions shown once with all usage locations
 *
 * Run: npm run validate:packages
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const ElementDefinitionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  dataType: z.enum(['a', 'n', 'an', 'id', 'dt', 'tm', 'r', 'b']),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive(),
  codeListCode: z.string().optional()
});

const ElementsFileSchema = z.record(z.string(), ElementDefinitionSchema);

const CompositeComponentSchema = z.object({
  elementCode: z.string().min(1),
  mandatory: z.boolean(),
  position: z.number().int().positive()
});

const CompositeDefinitionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  components: z.array(CompositeComponentSchema)
});

const CompositesFileSchema = z.record(z.string(), CompositeDefinitionSchema);

const SegmentElementSchema = z.discriminatedUnion('nodeType', [
  z.object({ nodeType: z.literal('element'), elementCode: z.string().min(1), mandatory: z.boolean(), position: z.number().int().positive() }),
  z.object({ nodeType: z.literal('composite'), compositeCode: z.string().min(1), mandatory: z.boolean(), position: z.number().int().positive() })
]);

const SegmentDefinitionSchema = z.object({
  tag: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  elements: z.array(SegmentElementSchema)
});

const SegmentsFileSchema = z.record(z.string(), SegmentDefinitionSchema);

interface MessageStructureNode {
  nodeType: 'segment' | 'segmentGroup';
  segmentRef?: string;
  id?: string;
  name?: string;
  structure?: MessageStructureNode[];
  mandatory?: boolean;
  maxOccurrences?: number;
  position?: number;
  triggerSegment?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MessageStructureNodeSchema: z.ZodType<MessageStructureNode> = z.lazy(() =>
  z.discriminatedUnion('nodeType', [
    z.object({ nodeType: z.literal('segment'), segmentRef: z.string().min(1), mandatory: z.boolean(), maxOccurrences: z.number().int().positive(), position: z.number().int().positive() }),
    z.object({ nodeType: z.literal('segmentGroup'), id: z.string().min(1), name: z.string().min(1), triggerSegment: z.string().min(1), mandatory: z.boolean(), maxOccurrences: z.number().int().positive(), position: z.number().int().positive(), structure: z.array(MessageStructureNodeSchema) })
  ]) as unknown as z.ZodType<MessageStructureNode>
);

const MessageFileSchema = z.object({
  standard: z.string().min(1),
  version: z.string().min(1),
  messageType: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  structure: z.array(MessageStructureNodeSchema)
});

// ============================================================================
// DATA PACKAGES
// ============================================================================

const PACKAGES_DIR = path.resolve(__dirname, '../packages');

const DATA_PACKAGES = [
  'edifact-d96a',
  'edifact-d01b',
  'edifact-d12a',
  'edifact-d20b',
  'eancom-2002',
  'x12-004010',
  'x12-006040',
  'hipaa-x12-005010'
];

// ============================================================================
// RESULT TYPES
// ============================================================================

interface ZodIssue {
  severity: 'error' | 'warning';
  file: string;
  message: string;
}

interface MissingSegmentIssue {
  kind: 'missing-segment';
  segmentTag: string;
  usedInMessages: string[];
}

interface MissingElementIssue {
  kind: 'missing-element';
  elementCode: string;
  usedInSegments: string[];
  usedInComposites: string[];
}

interface MissingCompositeIssue {
  kind: 'missing-composite';
  compositeCode: string;
  usedInSegments: string[];
}

type IntegrityIssue = MissingSegmentIssue | MissingElementIssue | MissingCompositeIssue;

interface PackageResult {
  name: string;
  zodIssues: ZodIssue[];
  integrityIssues: IntegrityIssue[];
  messagesChecked: number;
  segmentsCount: number;
  elementsCount: number;
  compositesCount: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function loadJson(filePath: string): unknown | null {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch { return null; }
}

function getMessageFiles(messagesDir: string): string[] {
  try {
    return fs.readdirSync(messagesDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(messagesDir, f));
  } catch { return []; }
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort();
}

function addToMapSet(map: Map<string, Set<string>>, key: string, value: string): void {
  const set = map.get(key) ?? new Set();
  set.add(value);
  map.set(key, set);
}

function mapSetToArray(set: Set<string> | undefined): string[] {
  return set ? Array.from(set) : [];
}

function truncateList(items: string[], max: number): string {
  if (items.length <= max) return items.join(', ');
  return items.slice(0, max).join(', ') + ` ...+${items.length - max} more`;
}

// ============================================================================
// ZOD VALIDATION
// ============================================================================

function validateDefinitionFiles(dataDir: string): ZodIssue[] {
  const issues: ZodIssue[] = [];
  const filesToValidate: [string, z.ZodTypeAny][] = [
    ['elements.json', ElementsFileSchema],
    ['segments.json', SegmentsFileSchema],
    ['composites.json', CompositesFileSchema]
  ];

  for (const [file, schema] of filesToValidate) {
    const raw = loadJson(path.join(dataDir, file));
    if (raw === null) {
      issues.push({ severity: 'warning', file, message: 'File not found' });
      continue;
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
      for (const err of result.error.issues) {
        issues.push({ severity: 'error', file, message: `[${err.path.join('.')}] ${err.message}` });
      }
    }
  }
  return issues;
}

function validateMessageFiles(dataDir: string): ZodIssue[] {
  const issues: ZodIssue[] = [];
  for (const msgFile of getMessageFiles(path.join(dataDir, 'messages'))) {
    const raw = loadJson(msgFile);
    if (!raw) {
      issues.push({ severity: 'error', file: path.basename(msgFile), message: 'Cannot read file' });
      continue;
    }
    const result = MessageFileSchema.safeParse(raw);
    if (!result.success) {
      for (const err of result.error.issues) {
        issues.push({ severity: 'error', file: path.basename(msgFile), message: `[${err.path.join('.')}] ${err.message}` });
      }
    }
  }
  return issues;
}

function validateZod(dataDir: string): ZodIssue[] {
  return [
    ...validateDefinitionFiles(dataDir),
    ...validateMessageFiles(dataDir),
  ];
}

// ============================================================================
// REFERENTIAL INTEGRITY — AGGREGATED
// ============================================================================

function collectSegmentRefs(node: MessageStructureNode, msgType: string, missingSegments: Map<string, Set<string>>, segments: Record<string, unknown>): void {
  if (node.nodeType === 'segment' && node.segmentRef) {
    if (!segments[node.segmentRef]) {
      addToMapSet(missingSegments, node.segmentRef, msgType);
    }
  } else if (node.nodeType === 'segmentGroup' && node.structure) {
    for (const child of node.structure) {
      collectSegmentRefs(child, msgType, missingSegments, segments);
    }
  }
}

function findMissingSegmentsInMessages(
  dataDir: string,
  segments: Record<string, unknown>
): Map<string, Set<string>> {
  const missingSegments = new Map<string, Set<string>>();

  for (const msgFilePath of getMessageFiles(path.join(dataDir, 'messages'))) {
    const raw = loadJson(msgFilePath);
    if (!raw) continue;
    const parsed = MessageFileSchema.safeParse(raw);
    if (!parsed.success) continue;

    for (const node of parsed.data.structure) {
      collectSegmentRefs(node, parsed.data.messageType, missingSegments, segments);
    }
  }
  return missingSegments;
}

function findMissingInSegments(
  segments: Record<string, z.infer<typeof SegmentDefinitionSchema>>,
  elements: Record<string, unknown>,
  composites: Record<string, unknown>
): { missingElements: Map<string, Set<string>>; missingComposites: Map<string, Set<string>> } {
  const missingElements = new Map<string, Set<string>>();
  const missingComposites = new Map<string, Set<string>>();

  for (const [segTag, segDef] of Object.entries(segments)) {
    for (const el of segDef.elements) {
      if (el.nodeType === 'element' && !elements[el.elementCode]) {
        addToMapSet(missingElements, el.elementCode, segTag);
      } else if (el.nodeType === 'composite' && !composites[el.compositeCode]) {
        addToMapSet(missingComposites, el.compositeCode, segTag);
      }
    }
  }
  return { missingElements, missingComposites };
}

function findMissingInComposites(
  composites: Record<string, z.infer<typeof CompositeDefinitionSchema>>,
  elements: Record<string, unknown>
): Map<string, Set<string>> {
  const missingElementsInComposites = new Map<string, Set<string>>();

  for (const [compCode, compDef] of Object.entries(composites)) {
    for (const comp of compDef.components) {
      if (!elements[comp.elementCode]) {
        addToMapSet(missingElementsInComposites, comp.elementCode, compCode);
      }
    }
  }
  return missingElementsInComposites;
}

function buildIntegrityIssues(
  missingSegments: Map<string, Set<string>>,
  missingElements: Map<string, Set<string>>,
  missingComposites: Map<string, Set<string>>,
  missingElementsInComposites: Map<string, Set<string>>
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];

  missingSegments.forEach((messages, segTag) => {
    issues.push({ kind: 'missing-segment', segmentTag: segTag, usedInMessages: unique(Array.from(messages)) });
  });

  const allMissingElementCodes = new Set([
    ...Array.from(missingElements.keys()),
    ...Array.from(missingElementsInComposites.keys()),
  ]);
  allMissingElementCodes.forEach(code => {
    issues.push({
      kind: 'missing-element',
      elementCode: code,
      usedInSegments: unique(mapSetToArray(missingElements.get(code))),
      usedInComposites: unique(mapSetToArray(missingElementsInComposites.get(code)))
    });
  });

  missingComposites.forEach((segs, code) => {
    issues.push({ kind: 'missing-composite', compositeCode: code, usedInSegments: unique(Array.from(segs)) });
  });

  return issues;
}

function validateIntegrity(
  dataDir: string,
  segments: Record<string, z.infer<typeof SegmentDefinitionSchema>>,
  elements: Record<string, z.infer<typeof ElementDefinitionSchema>>,
  composites: Record<string, z.infer<typeof CompositeDefinitionSchema>>
): IntegrityIssue[] {
  const missingSegments = findMissingSegmentsInMessages(dataDir, segments);
  const { missingElements, missingComposites } = findMissingInSegments(segments, elements, composites);
  const missingElementsInComposites = findMissingInComposites(composites, elements);

  return buildIntegrityIssues(missingSegments, missingElements, missingComposites, missingElementsInComposites);
}

// ============================================================================
// VALIDATE ONE PACKAGE
// ============================================================================

function validatePackage(pkgName: string): PackageResult {
  const dataDir = path.join(PACKAGES_DIR, pkgName, 'data');

  if (!fs.existsSync(dataDir)) {
    return { name: pkgName, zodIssues: [{ severity: 'error', file: 'data/', message: 'data/ directory not found' }], integrityIssues: [], messagesChecked: 0, segmentsCount: 0, elementsCount: 0, compositesCount: 0 };
  }

  const zodIssues = validateZod(dataDir);

  const segments = SegmentsFileSchema.safeParse(loadJson(path.join(dataDir, 'segments.json')));
  const elements = ElementsFileSchema.safeParse(loadJson(path.join(dataDir, 'elements.json')));
  const composites = CompositesFileSchema.safeParse(loadJson(path.join(dataDir, 'composites.json')));

  const segData = segments.success ? segments.data : {};
  const elData = elements.success ? elements.data : {};
  const compData = composites.success ? composites.data : {};

  const messagesChecked = getMessageFiles(path.join(dataDir, 'messages')).length;
  const integrityIssues = validateIntegrity(dataDir, segData, elData, compData);

  return { name: pkgName, zodIssues, integrityIssues, messagesChecked, segmentsCount: Object.keys(segData).length, elementsCount: Object.keys(elData).length, compositesCount: Object.keys(compData).length };
}

// ============================================================================
// REPORT - PRINTING
// ============================================================================

interface ReportColors {
  R: string; G: string; Y: string; B: string; BOLD: string; X: string;
}

function getColors(): ReportColors {
  const useColor = process.stdout.isTTY && !process.env['NO_COLOR'];
  return {
    R: useColor ? '\x1b[31m' : '',
    G: useColor ? '\x1b[32m' : '',
    Y: useColor ? '\x1b[33m' : '',
    B: useColor ? '\x1b[34m' : '',
    BOLD: useColor ? '\x1b[1m' : '',
    X: useColor ? '\x1b[0m' : '',
  };
}

function printPackageHeader(result: PackageResult, colors: ReportColors): void {
  const { B, G, R, BOLD, X } = colors;
  const zodErrors = result.zodIssues.filter(i => i.severity === 'error').length;
  const intCount = result.integrityIssues.length;
  const ok = zodErrors === 0 && intCount === 0;

  console.log(`${BOLD}${B}▶ ${result.name}${X}  ${ok ? `${G}✓ OK${X}` : `${R}✗ FAIL${X}`}`);
  console.log(`  Segments: ${result.segmentsCount} | Elements: ${result.elementsCount} | Composites: ${result.compositesCount} | Messages: ${result.messagesChecked}`);
}

function printZodIssues(result: PackageResult, colors: ReportColors): void {
  const { R, Y, X } = colors;
  const zodErrors = result.zodIssues.filter(i => i.severity === 'error');
  const zodWarnings = result.zodIssues.filter(i => i.severity === 'warning');

  for (const i of zodWarnings) {
    console.log(`  ${Y}WARN [${i.file}] ${i.message}${X}`);
  }

  if (zodErrors.length > 0) {
    console.log(`  ${R}Zod errors: ${zodErrors.length}${X}`);
    const MAX_SHOWN = 5;
    for (const i of zodErrors.slice(0, MAX_SHOWN)) {
      console.log(`    ${R}[${i.file}] ${i.message}${X}`);
    }
    if (zodErrors.length > MAX_SHOWN) {
      console.log(`    ${R}...and ${zodErrors.length - MAX_SHOWN} more${X}`);
    }
  }
}

function printIntegrityIssues(result: PackageResult, colors: ReportColors): void {
  const { R, X } = colors;
  const MAX_ITEMS = 5;
  const missing = result.integrityIssues.filter(i => i.kind === 'missing-segment') as MissingSegmentIssue[];
  const missingEl = result.integrityIssues.filter(i => i.kind === 'missing-element') as MissingElementIssue[];
  const missingComp = result.integrityIssues.filter(i => i.kind === 'missing-composite') as MissingCompositeIssue[];

  if (missing.length > 0) {
    console.log(`  ${R}Missing segment definitions: ${missing.length}${X}`);
    for (const i of missing) {
      console.log(`    ${R}${i.segmentTag}${X}  -> used in messages: ${truncateList(i.usedInMessages, MAX_ITEMS)}`);
    }
  }

  if (missingEl.length > 0) {
    console.log(`  ${R}Missing element definitions: ${missingEl.length}${X}`);
    for (const i of missingEl) {
      const segs = i.usedInSegments.length > 0 ? `segments: ${truncateList(i.usedInSegments, MAX_ITEMS)}` : '';
      const comps = i.usedInComposites.length > 0 ? `composites: ${truncateList(i.usedInComposites, MAX_ITEMS)}` : '';
      const usage = [segs, comps].filter(Boolean).join(' | ');
      console.log(`    ${R}${i.elementCode}${X}  -> used in ${usage}`);
    }
  }

  if (missingComp.length > 0) {
    console.log(`  ${R}Missing composite definitions: ${missingComp.length}${X}`);
    for (const i of missingComp) {
      console.log(`    ${R}${i.compositeCode}${X}  -> used in segments: ${truncateList(i.usedInSegments, MAX_ITEMS)}`);
    }
  }
}

function printPackageResult(result: PackageResult, colors: ReportColors): void {
  const { G, X } = colors;
  const zodErrors = result.zodIssues.filter(i => i.severity === 'error').length;
  const intCount = result.integrityIssues.length;
  const ok = zodErrors === 0 && intCount === 0;

  printPackageHeader(result, colors);
  printZodIssues(result, colors);
  if (intCount > 0) printIntegrityIssues(result, colors);
  if (ok) console.log(`  ${G}All ${result.messagesChecked} messages validated successfully [OK]${X}`);
  console.log();
}

function printSummary(results: PackageResult[], colors: ReportColors): void {
  const { R, G, BOLD, X } = colors;
  const totalZodErrors = results.reduce((sum, r) => sum + r.zodIssues.filter(i => i.severity === 'error').length, 0);
  const totalIntegrityIssues = results.reduce((sum, r) => sum + r.integrityIssues.length, 0);
  const totalMessages = results.reduce((sum, r) => sum + r.messagesChecked, 0);
  const passed = results.filter(r => r.zodIssues.filter(i => i.severity === 'error').length === 0 && r.integrityIssues.length === 0).length;

  console.log(`${BOLD}+================================================================+`);
  console.log(`|  SUMMARY                                                     |`);
  console.log(`+================================================================+${X}`);
  console.log(`  Packages checked:  ${results.length}`);
  console.log(`  Messages checked:  ${totalMessages}`);
  console.log(`  Zod errors:        ${totalZodErrors > 0 ? R : G}${totalZodErrors}${X}`);
  console.log(`  Integrity issues:  ${totalIntegrityIssues > 0 ? R : G}${totalIntegrityIssues}${X}`);
  console.log(`  Passed:            ${G}${passed}${X}`);
  console.log(`  Failed:            ${passed < results.length ? R : G}${results.length - passed}${X}\n`);

  if (totalZodErrors > 0 || totalIntegrityIssues > 0) process.exit(1);
}

function printReport(results: PackageResult[]): void {
  const colors = getColors();
  const { BOLD, X } = colors;

  console.log(`\n${BOLD}+================================================================+`);
  console.log(`|        EDIFlow Data Package Validation Report                |`);
  console.log(`+================================================================+${X}\n`);

  for (const result of results) {
    printPackageResult(result, colors);
  }

  printSummary(results, colors);
}

// ============================================================================
// MAIN
// ============================================================================

const results = DATA_PACKAGES.map(validatePackage);

const lines: string[] = [];
const origLog = console.log;
console.log = (...args: unknown[]) => {
  const line = args.map(String).join(' ');
  lines.push(line);
  origLog(...args);
};

printReport(results);

console.log = origLog;
const plainText = lines
  .map(l => l.replace(/\x1b\[[0-9;]*m/g, ''))
  .join('\n');

const reportFile = path.resolve(__dirname, '../temp/validation-report.txt');
fs.mkdirSync(path.dirname(reportFile), { recursive: true });
fs.writeFileSync(reportFile, plainText, 'utf-8');
process.stderr.write(`\nReport saved to: ${reportFile}\n`);

