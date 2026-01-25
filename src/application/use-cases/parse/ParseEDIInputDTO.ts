import { Standard } from '@domain';
import type { ParserConfig } from '@application/configuration';

export interface ParseEDIInputDTO {
  message: string;
  standard: Standard;
  strictMode?: boolean;
  parserConfig?: ParserConfig;
}
