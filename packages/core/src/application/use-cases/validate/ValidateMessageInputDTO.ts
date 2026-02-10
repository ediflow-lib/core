import type { EDIMessage } from '@domain';
import type { MessageStructureDTO } from '@application/dtos';

export interface ValidateMessageInputDTO {
  message: EDIMessage;
  strictMode?: boolean;

  messageStructure?: MessageStructureDTO;
  enableStructuralValidation?: boolean;
}
