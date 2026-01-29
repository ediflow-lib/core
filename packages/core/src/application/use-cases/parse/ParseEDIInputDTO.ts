import { Standard } from '@domain';
import type { ParserConfig } from '@application/configuration';
import type { MessageStructure } from '@domain/repositories';

export interface ParseEDIInputDTO {
  message: string;
  standard: Standard;
  strictMode?: boolean;
  parserConfig?: ParserConfig;

  // Phase 2 Support (US-6.2)
  returnTypedObject?: boolean;      // If true, returns business object instead of EDIMessage
  messageStructure?: MessageStructure;  // Optional: provide structure directly (bypass repository)
}
