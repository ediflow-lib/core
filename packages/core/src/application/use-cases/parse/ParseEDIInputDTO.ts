import { Standard } from '@domain';
import type { ParserConfig } from '@application/configuration';
import type { MessageStructureDTO } from '@application/dtos';
import type { MappingKeyStrategy } from '@application/services/mapping/OutputKeyStrategy';

export interface ParseEDIInputDTO {
  message: string;
  standard: Standard;
  strictMode?: boolean;
  parserConfig?: ParserConfig;

  /** If true, runs Phase 2 mapping and returns a business object */
  returnTypedObject?: boolean;
  /** Structure definition for Phase 2 mapping (bypass repository) */
  messageStructure?: MessageStructureDTO;
  /** Key naming strategy for business-object output (default: 'code') */
  mappingKeyStrategy?: MappingKeyStrategy;
}
