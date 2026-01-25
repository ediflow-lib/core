import { writeFileSync } from 'fs';

/**
 * Formats output data for CLI presentation.
 *
 * Presentation Layer utility - handles output formatting.
 */
export class OutputFormatter {
  /**
   * Formats data as JSON string.
   */
  static toJSON(data: any, pretty: boolean = true): string {
    return pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
  }

  /**
   * Formats data as YAML string (simplified).
   * For full YAML support, consider adding 'js-yaml' library.
   */
  static toYAML(data: any): string {
    // Simple YAML-like formatting
    // TODO: Use 'js-yaml' library for full YAML support if needed
    return JSON.stringify(data, null, 2);
  }

  /**
   * Outputs result to console or file.
   *
   * @param content - Content to output
   * @param outputFile - Optional file path for output
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
