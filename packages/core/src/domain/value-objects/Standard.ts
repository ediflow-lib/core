/**
 * EDI Standards
 *
 * Supported EDI formats including custom in-house formats.
 */
export enum Standard {
  EDIFACT = 'EDIFACT',
  X12 = 'X12',
  IDOC = 'IDOC',
  VDA = 'VDA',
  HL7v2 = 'HL7v2',
  INHOUSE = 'INHOUSE',  // Custom/proprietary formats defined by users
}
