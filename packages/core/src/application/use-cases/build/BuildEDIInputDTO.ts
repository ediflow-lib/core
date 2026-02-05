import { EDIMessage, Delimiters } from '@domain';
import {MessageStructureDTO} from "@infrastructure/repositories/dtos";


export interface BuildEDIInputDTO {
  message?: EDIMessage;
  delimiters?: Delimiters;
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
