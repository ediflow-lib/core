import { DefinitionNotFoundError } from '@ediflow/core';

/**
 * Handles error formatting for CLI output.
 *
 * Presentation Layer utility - formats errors for user-friendly display.
 */
export class ErrorHandler {
  /**
   * Formats an error for CLI output.
   *
   * @param error - Error to format
   * @returns Formatted error message
   */
  static format(error: Error | unknown): string {
    // Special handling for DefinitionNotFoundError
    if (error instanceof DefinitionNotFoundError) {
      return this.formatDefinitionNotFound(error);
    }

    if (error instanceof Error) {
      return `❌ Error: ${error.message}`;
    }
    return `❌ Error: ${String(error)}`;
  }

  /**
   * Formats DefinitionNotFoundError with installation instructions.
   *
   * @param error - DefinitionNotFoundError instance
   * @returns User-friendly error message with installation help
   */
  private static formatDefinitionNotFound(error: DefinitionNotFoundError): string {
    const standard = error.standard.toString();
    const version = error.version.value;
    const messageType = error.messageType.value;

    // Map version to package name (e.g., "D.96A" -> "edifact-d96a")
    const packageName = this.getPackageName(standard, version);

    const lines = [
      '❌ Message Definition Not Found',
      '',
      `  Standard:     ${standard}`,
      `  Version:      ${version}`,
      `  Message Type: ${messageType}`,
      '',
      '📦 The required data package is not installed.',
      '',
      '   To fix this, install the package:',
      `   npm install @ediflow/${packageName}`,
      '',
      '   Available packages:',
      '   • @ediflow/edifact-d96a  (EDIFACT D.96A)',
      '   • @ediflow/edifact-d01b  (EDIFACT D.01B)',
      '   • @ediflow/edifact-d20b  (EDIFACT D.20B)',
      '',
      '   💡 Tip: You can install multiple versions if needed.',
    ];

    return lines.join('\n');
  }

  /**
   * Maps standard and version to NPM package name.
   *
   * @param standard - EDI standard
   * @param version - Standard version
   * @returns Package name (e.g., "edifact-d96a")
   */
  private static getPackageName(standard: string, version: string): string {
    const normalizedStandard = standard.toLowerCase();
    // Remove dots from version: "D.96A" -> "d96a"
    const normalizedVersion = version.toLowerCase().replace(/\./g, '');
    return `${normalizedStandard}-${normalizedVersion}`;
  }

  /**
   * Formats multiple errors.
   *
   * @param errors - Array of errors
   * @returns Formatted error messages
   */
  static formatMultiple(errors: Array<{ code: string; message: string; field?: string }>): string {
    const lines = ['❌ Errors found:'];
    errors.forEach((err, index) => {
      const field = err.field ? ` (${err.field})` : '';
      lines.push(`  ${index + 1}. [${err.code}]${field} ${err.message}`);
    });
    return lines.join('\n');
  }

  /**
   * Formats validation errors.
   *
   * @param errors - Validation errors
   * @returns Formatted validation error message
   */
  static formatValidation(errors: Array<{ code?: string; message: string; field?: string }>): string {
    const lines = ['❌ Validation errors found:'];
    errors.forEach((err, index) => {
      const field = err.field ? ` (${err.field})` : '';
      const code = err.code ? `[${err.code}]` : '[VALIDATION_ERROR]';
      lines.push(`  ${index + 1}. ${code}${field} ${err.message}`);
    });
    return lines.join('\n');
  }
}
