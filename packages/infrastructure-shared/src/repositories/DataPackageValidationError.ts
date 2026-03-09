import type { DataPackageIssue } from './DataPackageValidator';

/**
 * Thrown when a data package (segments.json, elements.json, etc.) is
 * incomplete or inconsistent — before any build attempt is made.
 *
 * Provides actionable context: which standard/version/messageType failed,
 * and exactly which definitions are missing.
 */
export class DataPackageValidationError extends Error {
  constructor(
    public readonly standard: string,
    public readonly version: string,
    public readonly messageType: string,
    public readonly issues: DataPackageIssue[]
  ) {
    const summary = issues
      .map(i => `  - ${i.message}`)
      .join('\n');

    super(
      `Data package validation failed for ${standard} ${version} ${messageType}:\n${summary}\n\n` +
      `Tip: Regenerate the data package or add the missing segment/element/composite definitions.`
    );

    this.name = 'DataPackageValidationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DataPackageValidationError);
    }
  }
}


