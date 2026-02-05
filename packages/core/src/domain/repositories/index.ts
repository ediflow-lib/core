/**
 * @deprecated This module is being refactored to Clean Architecture
 *
 * - IMessageStructureRepository moved to: application/ports/output/
 * - MessageStructure renamed to: infrastructure/repositories/dtos/MessageStructureDTO
 * - MessageDefinition moved to: infrastructure/repositories/dtos/MessageDefinitionDTO
 *
 * Please update your imports:
 * - import { IMessageStructureRepository } from '@application/ports/output';
 * - import { MessageStructureDTO } from '@infrastructure/repositories/dtos';
 */

// Re-export from new locations for backward compatibility (temporary)
export { IMessageStructureRepository } from '../../application/ports/output/IMessageStructureRepository';
export type { MessageStructureDTO, SegmentNode, SegmentGroupNode, SegmentOrGroup, ElementNode, CompositeElementNode, ElementOrComposite } from '../../infrastructure/repositories/dtos/MessageStructureDTO';
export type { MessageDefinitionDTO } from '../../infrastructure/repositories/dtos/MessageDefinitionDTO';

// Aliases for backward compatibility
export type MessageStructure = import('../../infrastructure/repositories/dtos/MessageStructureDTO').MessageStructureDTO;
export type MessageDefinition = import('../../infrastructure/repositories/dtos/MessageDefinitionDTO').MessageDefinitionDTO;
