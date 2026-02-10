import { readFileSync } from 'fs';

/**
 * Reads EDI file content.
 *
 * Presentation Layer utility - handles file I/O for CLI.
 *
 * @param filePath - Path to EDI file
 * @returns File content as string
 * @throws Error if file cannot be read
 */
export function readEDIFile(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read file '${filePath}': ${error.message}`);
    }
    throw new Error(`Failed to read file '${filePath}': Unknown error`);
  }
}
