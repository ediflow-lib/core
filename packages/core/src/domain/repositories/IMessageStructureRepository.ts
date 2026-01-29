import { MessageStructure } from './MessageStructure';

export interface IMessageStructureRepository {
  getMessageDefinition(
    standard: string,
    version: string,
    messageType: string
  ): Promise<MessageStructure | null>;

  getAllMessageTypes(standard: string, version: string): Promise<string[]>;

  hasMessageDefinition(
    standard: string,
    version: string,
    messageType: string
  ): Promise<boolean>;
}
