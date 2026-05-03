import { IMessageStructureRepository } from '@application/ports/output/IMessageStructureRepository';
import type { MessageStructureDTO } from '@application/dtos';

export class MessageStructureService {
  constructor(private readonly repository: IMessageStructureRepository) {}

  async getMessageStructure(
    standard: string,
    version: string,
    messageType: string
  ): Promise<MessageStructureDTO | null> {
    const structure = await this.repository.getMessageStructure(
      standard,
      version,
      messageType
    );

    if (!structure) {
      throw new Error(
        `Message structure not found: ${standard} ${version} ${messageType}`
      );
    }

    return structure;
  }

  async getAllMessageTypes(
    standard: string,
    version: string
  ): Promise<string[]> {
    return this.repository.getAllMessageTypes(standard, version);
  }

  async hasMessageStructure(
    standard: string,
    version: string,
    messageType: string
  ): Promise<boolean> {
    return this.repository.hasMessageStructure(standard, version, messageType);
  }
}
