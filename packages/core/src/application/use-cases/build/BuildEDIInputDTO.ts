import { EDIMessage, Delimiters } from '@domain';
import { MessageStructureDTO } from "@infrastructure/repositories/dtos";
import { OutputFormat } from '@application/ports/output';

export interface BuildEDIInputDTO {
  message?: EDIMessage;
  delimiters?: Delimiters;
  format?: OutputFormat;
  validateBeforeBuild?: boolean;

  businessObject?: any;
  messageStructure?: MessageStructureDTO;

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
