import { writeFileSync } from 'fs';

/**
 * Formats output data for CLI presentation.
 *
 * Presentation Layer utility - handles output formatting.
 */
export class OutputFormatter {
  /**
   * Removes empty values (null, "", [], {}) recursively from an object.
   * Used by --skip-empty option (default: true).
   */
  static removeEmpty(value: unknown): unknown {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') return value === '' ? undefined : value;
    if (Array.isArray(value)) {
      const filtered = value.map(v => OutputFormatter.removeEmpty(v)).filter(v => v !== undefined);
      return filtered.length === 0 ? undefined : filtered;
    }
    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const cleaned = OutputFormatter.removeEmpty(v);
        if (cleaned !== undefined) {
          result[k] = cleaned;
        }
      }
      return Object.keys(result).length === 0 ? undefined : result;
    }
    return value;
  }

  /**
   * Formats data as JSON string.
   */
  static toJSON(data: unknown, pretty: boolean = true, skipEmpty: boolean = false): string {
    const processed = skipEmpty ? (OutputFormatter.removeEmpty(data) ?? {}) : data;
    return pretty
      ? JSON.stringify(processed, null, 2)
      : JSON.stringify(processed);
  }

  /**
   * Formats data as YAML string (simplified).
   */
  static toYAML(data: unknown, skipEmpty: boolean = false): string {
    const processed = skipEmpty ? (OutputFormatter.removeEmpty(data) ?? {}) : data;
    return JSON.stringify(processed, null, 2);
  }

  /**
   * Outputs result to console or file.
   */
  static output(content: string, outputFile?: string): void {
    if (outputFile) {
      try {
        writeFileSync(outputFile, content, 'utf-8');
        console.log(`✓ Output written to: ${outputFile}`);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to write output file: ${error.message}`);
        }
        throw new Error('Failed to write output file: Unknown error');
      }
    } else {
      console.log(content);
    }
  }
}
