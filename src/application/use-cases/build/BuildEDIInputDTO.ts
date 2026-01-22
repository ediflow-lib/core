import { EDIMessage, Delimiters } from '../../../domain';

export interface BuildEDIInputDTO {
  message: EDIMessage;
  delimiters?: Delimiters;
  validateBeforeBuild?: boolean;
}
