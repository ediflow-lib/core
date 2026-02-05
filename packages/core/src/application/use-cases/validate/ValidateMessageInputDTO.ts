import type { EDIMessage } from '@domain';
import type { MessageStructureDTO } from '@infrastructure/repositories/dtos';

export interface ValidateMessageInputDTO {
  message: EDIMessage;
  strictMode?: boolean;

  messageStructure?: MessageStructureDTO;
  enableStructuralValidation?: boolean;
}
