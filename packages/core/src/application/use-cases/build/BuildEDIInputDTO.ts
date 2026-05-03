import { EDIMessage, Delimiters } from '@domain';
import { MessageStructureDTO } from "@application/dtos";
import { OutputFormat } from '@application/ports/output';
import type { MappingKeyStrategy } from '@application/services/mapping/OutputKeyStrategy';

export interface BuildEDIInputDTO {
  message?: EDIMessage;
  delimiters?: Delimiters;
  format?: OutputFormat;
  validateBeforeBuild?: boolean;

  businessObject?: any;
  messageStructure?: MessageStructureDTO;
  businessObjectKeyStyle?: MappingKeyStrategy;

  includeEnvelope?: boolean;
  includeInterchange?: boolean;
  messageType?: string;
  version?: string;
  messageRef?: string;
  sender?: string;
  receiver?: string;
  controlRef?: string;
  interchangeDateTime?: Date;
}
