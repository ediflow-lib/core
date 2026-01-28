import { EDIMessage, Delimiters } from '@domain';
import type { MessageStructure } from '@domain/repositories';

export interface BuildEDIInputDTO {
  message?: EDIMessage;
  delimiters?: Delimiters;
  validateBeforeBuild?: boolean;

  businessObject?: any;
  messageStructure?: MessageStructure;

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
