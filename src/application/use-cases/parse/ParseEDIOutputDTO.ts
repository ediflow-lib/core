import { EDIMessage, Standard, Version, MessageType, Delimiters } from '../../../domain';

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

export interface ParseEDIOutputDTO {
  success: boolean;
  message?: EDIMessage;
  errors?: ParseError[];
  warnings?: ParseWarning[];
  metadata: {
    standard: Standard;
    version?: Version;
    messageType?: MessageType;
    segmentCount: number;
    delimiters: Delimiters;
  };
}
