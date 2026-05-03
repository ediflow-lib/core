import { z } from 'zod';

// ============================================================================
// MESSAGE FILE (messages/*.json → messages.schema.yml)
// ============================================================================

const SegmentReferenceSchema = z.object({
  nodeType: z.literal('segment'),
  segmentRef: z.string().min(1),
  mandatory: z.boolean(),
  maxOccurrences: z.number().int().positive(),
  position: z.number().int().positive()
});

const SegmentGroupStructureSchema: z.ZodType<SegmentGroupStructure> = z.lazy(() =>
  z.object({
    nodeType: z.literal('segmentGroup'),
    id: z.string().min(1),
    name: z.string().min(1),
    triggerSegment: z.string().min(1),
    mandatory: z.boolean(),
    maxOccurrences: z.number().int().positive(),
    position: z.number().int().positive(),
    structure: z.array(z.union([SegmentReferenceSchema, SegmentGroupStructureSchema]))
  })
);

const MessageStructureNodeSchema: z.ZodType<MessageStructureNode> = z.lazy(() =>
  z.union([SegmentReferenceSchema, SegmentGroupStructureSchema])
);

export const MessageFileSchema = z.object({
  standard: z.string().min(1),
  version: z.string().min(1),
  messageType: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  st03: z.string().optional(),
  structure: z.array(MessageStructureNodeSchema)
});

// ============================================================================
// SEGMENTS FILE (segments.json → segments.schema.yml)
// ============================================================================

const ElementReferenceSchema = z.object({
  nodeType: z.literal('element'),
  elementCode: z.string().min(1),
  mandatory: z.boolean(),
  position: z.number().int().positive()
});

const CompositeReferenceSchema = z.object({
  nodeType: z.literal('composite'),
  compositeCode: z.string().min(1),
  mandatory: z.boolean(),
  position: z.number().int().positive()
});

const SegmentElementSchema = z.discriminatedUnion('nodeType', [
  ElementReferenceSchema,
  CompositeReferenceSchema
]);

const SegmentDefinitionSchema = z.object({
  tag: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  elements: z.array(SegmentElementSchema)
});

export const SegmentsFileSchema = z.record(z.string(), SegmentDefinitionSchema);

// ============================================================================
// ELEMENTS FILE (elements.json → elements.schema.yml)
// ============================================================================

const DataTypeSchema = z.enum(['a', 'n', 'an', 'id', 'dt', 'tm', 'r', 'b']);

const ElementDefinitionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  dataType: DataTypeSchema,
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive(),
  codeListCode: z.string().optional()
});

export const ElementsFileSchema = z.record(z.string(), ElementDefinitionSchema);

// ============================================================================
// COMPOSITES FILE (composites.json → composites.schema.yml)
// ============================================================================

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

export const CompositesFileSchema = z.record(z.string(), CompositeDefinitionSchema);

// ============================================================================
// SYNTAX RULES FILE (segment-syntax-rules.json → syntax-rules.schema.yml)
// ============================================================================

const SyntaxRuleTypeSchema = z.enum(['P', 'R', 'E', 'C', 'L', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6']);

const SyntaxRuleSchema = z.object({
  type: SyntaxRuleTypeSchema,
  positions: z.array(z.number().int().positive()).min(2),
  description: z.string().min(1)
});

export const SyntaxRulesFileSchema = z.record(z.string(), z.array(SyntaxRuleSchema));

// ============================================================================
// CODE LIST FILE (codes/{code}.json → codelists.schema.yml)
// ============================================================================

const CodeValueSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional()
});

export const CodeListSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  values: z.array(CodeValueSchema)
});

// ============================================================================
// INFERRED TYPES (from Zod schemas — single source of truth)
// ============================================================================

export type SegmentReference = z.infer<typeof SegmentReferenceSchema>;

// Explicit interface to break circular reference between SegmentGroupStructureSchema and its inferred type
export interface SegmentGroupStructure {
  nodeType: 'segmentGroup';
  id: string;
  name: string;
  triggerSegment: string;
  mandatory: boolean;
  maxOccurrences: number;
  position: number;
  structure: MessageStructureNode[];
}

export type MessageStructureNode = SegmentReference | SegmentGroupStructure;
export type MessageFile = z.infer<typeof MessageFileSchema>;
export type ElementReference = z.infer<typeof ElementReferenceSchema>;
export type CompositeReference = z.infer<typeof CompositeReferenceSchema>;
export type SegmentElement = z.infer<typeof SegmentElementSchema>;
export type SegmentDefinition = z.infer<typeof SegmentDefinitionSchema>;
export type DataType = z.infer<typeof DataTypeSchema>;
export type ElementDefinition = z.infer<typeof ElementDefinitionSchema>;
export type CompositeComponent = z.infer<typeof CompositeComponentSchema>;
export type CompositeDefinition = z.infer<typeof CompositeDefinitionSchema>;
export type SyntaxRuleType = z.infer<typeof SyntaxRuleTypeSchema>;
export type SyntaxRule = z.infer<typeof SyntaxRuleSchema>;
export type CodeValue = z.infer<typeof CodeValueSchema>;
export type CodeList = z.infer<typeof CodeListSchema>;
