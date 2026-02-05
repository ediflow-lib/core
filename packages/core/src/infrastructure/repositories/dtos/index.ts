/**
 * Infrastructure DTOs for Repository Pattern
 *
 * These DTOs represent external data structures (from JSON files, DB, API).
 * They are NOT domain entities!
 *
 * Domain Entity = EDIMessage (the parsed result)
 * Infrastructure DTO = MessageStructureDTO (the external definition)
 */

export { MessageStructureDTO } from './MessageStructureDTO';
export { MessageDefinitionDTO } from './MessageDefinitionDTO';
export type { SegmentNode, SegmentGroupNode, SegmentOrGroup, ElementNode, CompositeElementNode, ElementOrComposite } from './MessageStructureDTO';
