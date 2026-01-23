import { EDIMessage, Delimiters, Standard } from '../../../domain';

export interface IParser {
  parse(segments: string[], delimiters: Delimiters): EDIMessage;
  getSupportedStandard(): Standard;
  canParse(segments: string[]): boolean;
}
