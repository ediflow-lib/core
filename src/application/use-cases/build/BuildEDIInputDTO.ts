import { EDIMessage, Delimiters } from '@domain';
import type { MessageStructure } from '@domain/repositories';

export interface BuildEDIInputDTO {
  message?: EDIMessage;          // Phase 1: Direct EDIMessage (existing)
  delimiters?: Delimiters;
  validateBeforeBuild?: boolean;

  // Phase 2 Support (US-6.2) - Alternative: Build from business object
  businessObject?: any;          // Typed business object (DESADV, ORDERS, etc.)
  messageStructure?: MessageStructure;  // Required if businessObject is provided
}
