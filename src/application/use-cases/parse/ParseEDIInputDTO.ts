import { Standard } from '@domain';

export interface ParseEDIInputDTO {
  message: string;
  standard: Standard;
  strictMode?: boolean;
}
