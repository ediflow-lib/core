import { EDIMessage } from '../../../domain';

export interface ValidateMessageInputDTO {
  message: EDIMessage;
  strictMode?: boolean;
}
