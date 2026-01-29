import { IMessageStructureRepository } from '@domain/repositories/IMessageStructureRepository';
import { MessageStructure } from '@domain/repositories/MessageStructure';

export class MessageStructureService {
  constructor(private readonly repository: IMessageStructureRepository) {}

  async getMessageDefinition(
    standard: string,
    version: string,
    messageType: string
  ): Promise<MessageStructure> {
    const definition = await this.repository.getMessageDefinition(
      standard,
      version,
      messageType
    );

    if (!definition) {
      throw new Error(
        `Message definition not found: ${standard} ${version} ${messageType}`
      );
    }

    return definition;
  }

  async getAllMessageTypes(
    standard: string,
    version: string
  ): Promise<string[]> {
    return this.repository.getAllMessageTypes(standard, version);
  }

  async hasMessageDefinition(
    standard: string,
    version: string,
    messageType: string
  ): Promise<boolean> {
    return this.repository.hasMessageDefinition(standard, version, messageType);
  }
}
