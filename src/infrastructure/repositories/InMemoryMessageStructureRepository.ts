import { IMessageStructureRepository } from '@domain/repositories/IMessageStructureRepository';
import { MessageStructure } from '@domain/repositories/MessageStructure';

export class InMemoryMessageStructureRepository implements IMessageStructureRepository {
  private definitions = new Map<string, MessageStructure>();

  async getMessageDefinition(
    standard: string,
    version: string,
    messageType: string
  ): Promise<MessageStructure | null> {
    const key = this.createKey(standard, version, messageType);
    return this.definitions.get(key) || null;
  }

  async getAllMessageTypes(standard: string, version: string): Promise<string[]> {
    const prefix = this.createKey(standard, version, '');
    const messageTypes: string[] = [];

    for (const key of this.definitions.keys()) {
      if (key.startsWith(prefix)) {
        const parts = key.split(':');
        if (parts[2]) {
          messageTypes.push(parts[2]);
        }
      }
    }

    return messageTypes;
  }

  async hasMessageDefinition(
    standard: string,
    version: string,
    messageType: string
  ): Promise<boolean> {
    const key = this.createKey(standard, version, messageType);
    return this.definitions.has(key);
  }

  register(definition: MessageStructure): void {
    const key = this.createKey(
      definition.standard,
      definition.version,
      definition.messageType
    );
    this.definitions.set(key, definition);
  }

  clear(): void {
    this.definitions.clear();
  }

  private createKey(standard: string, version: string, messageType: string): string {
    return `${standard.toLowerCase()}:${version.toLowerCase()}:${messageType.toUpperCase()}`;
  }
}
