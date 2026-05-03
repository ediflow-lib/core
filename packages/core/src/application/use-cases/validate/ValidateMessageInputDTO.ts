import type { EDIMessage } from '@domain';
import type { MessageStructureDTO } from '@application/dtos';

export interface ValidateMessageInputDTO {
  message: EDIMessage;
  strictMode?: boolean;

  messageStructure?: MessageStructureDTO;
  enableStructuralValidation?: boolean;

  /** Opt-in: validate element values against code lists */
  validateCodes?: boolean;
  /** Pre-loaded code lists: Map<codeListCode, Set<validValues>> */
  codeLists?: Map<string, Set<string>>;
}
