/**
 * Application DTOs
 *
 * Data Transfer Objects for application layer.
 * These DTOs represent external data structures (from JSON files, DB, API).
 * They are NOT domain entities!
 *
 * Domain Entity = EDIMessage (the parsed result)
 * Application DTO = MessageStructureDTO (the external definition)
 */

export * from './MessageStructureDTO';
export type { MessageStructureDTO, SegmentNode, SegmentGroupNode, SegmentOrGroup, ElementNode, CompositeElementNode, ElementOrComposite, SyntaxRuleDefinition } from './MessageStructureDTO';
