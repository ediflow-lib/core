import { EDIMessage } from '@domain';
import { MessageStructure } from '@domain/repositories/MessageStructure';

export interface ValidateMessageInputDTO {
  message: EDIMessage;
  strictMode?: boolean;
  // Phase 2: Structure Validation (optional)
  messageStructure?: MessageStructure;
  enableStructuralValidation?: boolean;
}
