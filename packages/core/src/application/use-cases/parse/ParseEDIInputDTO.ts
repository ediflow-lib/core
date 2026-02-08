import { Standard } from '@domain';
import type { ParserConfig } from '@application/configuration';
import {MessageStructureDTO} from "@application/dtos";


export interface ParseEDIInputDTO {
  message: string;
  standard: Standard;
  strictMode?: boolean;
  parserConfig?: ParserConfig;


  returnTypedObject?: boolean;      // If true, returns business object instead of EDIMessage
  messageStructure?: MessageStructureDTO;  // Optional: provide structure directly (bypass repository)
}
