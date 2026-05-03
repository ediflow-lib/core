/**
 * ValidationLevel
 *
 * Controls how strict the X12 validation is.
 *
 * STRICT  — All rules: envelope + element types + syntax rules
 * LENIENT — Only structure + envelope (no element type/length checks)
 *
 * @example
 * X12ValidationServiceBuilder.custom().withValidationLevel(ValidationLevel.STRICT, structure).build();
 * X12ValidationServiceBuilder.custom().withValidationLevel(ValidationLevel.LENIENT).build();
 */
export enum ValidationLevel {
  STRICT = 'STRICT',
  LENIENT = 'LENIENT',
}


