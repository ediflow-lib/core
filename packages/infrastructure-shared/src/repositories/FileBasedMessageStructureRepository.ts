
import * as fs from 'fs/promises';
import * as path from 'path';
import type { IMessageStructureRepository, MessageStructureDTO } from '@ediflow/core';

export class FileBasedMessageStructureRepository implements IMessageStructureRepository {
  constructor(private readonly basePath: string) {}

  async getMessageDefinition(
    standard: string,
    version: string,
    messageType: string
  ): Promise<MessageStructureDTO | null> {
    try {
      const filePath = this.getMessageFilePath(standard, version, messageType);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as MessageStructureDTO;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async getAllMessageTypes(standard: string, version: string): Promise<string[]> {
    try {
      const dirPath = this.getMessageDirPath(standard, version);
      const files = await fs.readdir(dirPath);

      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, path.extname(file)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async hasMessageDefinition(
    standard: string,
    version: string,
    messageType: string
  ): Promise<boolean> {
    try {
      const filePath = this.getMessageFilePath(standard, version, messageType);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private getMessageDirPath(standard: string, version: string): string {
    const normalizedVersion = version.toLowerCase().replace(/\./g, '');
    return path.join(
      this.basePath,
      `${standard.toLowerCase()}-${normalizedVersion}`,
      'data',
      'messages'
    );
  }

  private getMessageFilePath(
    standard: string,
    version: string,
    messageType: string
  ): string {
    return path.join(
      this.getMessageDirPath(standard, version),
      `${messageType.toUpperCase()}.json`
    );
  }
}
