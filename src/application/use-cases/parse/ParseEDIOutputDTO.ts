import { EDIMessage, Standard, Version, MessageType, Delimiters } from '@domain';

export interface ParseError {
  code: string;
  message: string;
  position?: number;
  segmentTag?: string;
}

export interface ParseWarning {
  code: string;
  message: string;
  position?: number;
  segmentTag?: string;
}

/**
 * Discriminated union for Parse EDI output.
 * TypeScript will narrow types correctly based on the `success` property.
 *
 * SUCCESS: message, metadata with full info
 * FAILURE: errors, metadata with partial info
 */
export type ParseEDIOutputDTO =
  | {
      success: true;
      message: EDIMessage;
      warnings?: ParseWarning[];
      metadata: {
        standard: Standard;
        version: Version;
        messageType: MessageType;
        segmentCount: number;
        delimiters: Delimiters;
      };
    }
  | {
      success: false;
      errors: ParseError[];
      warnings?: ParseWarning[];
      metadata: {
        standard: Standard;
        version?: Version;
        messageType?: MessageType;
        segmentCount: number;
        delimiters: Delimiters;
      };
    };
