export interface BuildError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Discriminated union for Build EDI output.
 * TypeScript will narrow types correctly based on the `success` property.
 *
 * SUCCESS: ediString is defined
 * FAILURE: errors is defined
 */
export type BuildEDIOutputDTO =
  | {
      success: true;
      ediString: string;
    }
  | {
      success: false;
      errors: BuildError[];
    };
