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
    if (error instanceof Error) {
      return `❌ Error: ${error.message}`;
    }
    return `❌ Error: ${String(error)}`;
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
