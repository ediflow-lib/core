import type { IMessageStructureRepository, MessageStructureDTO } from '@ediflow/core';


export class InMemoryMessageStructureRepository implements IMessageStructureRepository {
  private structures = new Map<string, MessageStructureDTO>();
  private codeLists = new Map<string, Set<string>>();

  async getMessageStructure(
    standard: string,
    version: string,
    messageType: string
  ): Promise<MessageStructureDTO | null> {
    const key = this.createKey(standard, version, messageType);
    return this.structures.get(key) ?? null;
  }

  async getAllMessageTypes(standard: string, version: string): Promise<string[]> {
    const prefix = this.createKey(standard, version, '');
    const messageTypes: string[] = [];

    for (const key of this.structures.keys()) {
      if (key.startsWith(prefix)) {
        const parts = key.split(':');
        if (parts[2]) {
          messageTypes.push(parts[2]);
        }
      }
    }

    return messageTypes;
  }

  async hasMessageStructure(
    standard: string,
    version: string,
    messageType: string
  ): Promise<boolean> {
    const key = this.createKey(standard, version, messageType);
    return this.structures.has(key);
  }

  async getCodeList(standard: string, version: string, codeListCode: string): Promise<Set<string> | null> {
    const key = `${standard.toLowerCase()}:${version.toLowerCase()}:${codeListCode}`;
    return this.codeLists.get(key) ?? null;
  }

  register(structure: MessageStructureDTO): void {
    const key = this.createKey(
      structure.standard,
      structure.version,
      structure.messageType
    );
    this.structures.set(key, structure);
  }

  registerCodeList(standard: string, version: string, codeListCode: string, values: Set<string>): void {
    const key = `${standard.toLowerCase()}:${version.toLowerCase()}:${codeListCode}`;
    this.codeLists.set(key, values);
  }

  clear(): void {
    this.structures.clear();
    this.codeLists.clear();
  }

  private createKey(standard: string, version: string, messageType: string): string {
    return `${standard.toLowerCase()}:${version.toLowerCase()}:${messageType.toUpperCase()}`;
  }
}
