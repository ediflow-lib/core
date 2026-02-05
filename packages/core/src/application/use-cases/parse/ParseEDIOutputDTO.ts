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
 * SUCCESS: message, metadata with full info, optional businessObject (Phase 2)
 * FAILURE: errors, metadata with partial info
 */
export type ParseEDIOutputDTO =
  | {
      success: true;
      message: EDIMessage;
      businessObject?: any;  // Phase 2: Typed business object (DESADV, ORDERS, etc.)
      warnings?: ParseWarning[];
      metadata: {
        standard: Standard;
        version: Version;
        messageType: MessageType;
        segmentCount: number;
        delimiters?: Delimiters;  // Optional: detected delimiters
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
        delimiters?: Delimiters;  // Optional: unknown on error
      };
    };
