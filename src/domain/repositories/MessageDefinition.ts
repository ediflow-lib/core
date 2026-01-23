import type { MessageType, Version, Standard } from '../value-objects';

/**
 * Definition of a single segment within a message.
 * Describes the structure and constraints of a segment.
 */
export interface SegmentDefinition {
  /** Segment tag (e.g., "UNH", "BGM", "DTM") */
  tag: string;

  /** Human-readable segment name (e.g., "Message Header", "Beginning of Message") */
  name: string;

  /** Whether this segment is mandatory in the message */
  mandatory: boolean;

  /** Maximum number of times this segment can occur (0 = unlimited) */
  maxOccurrences: number;
}

/**
 * Complete definition of an EDI message type.
 * Describes the structure, segments, and rules for a specific message.
 */
export interface MessageDefinition {
  /** The message type this definition describes */
  messageType: MessageType;

  /** The version this definition is for */
  version: Version;

  /** The EDI standard (EDIFACT, X12, etc.) */
  standard: Standard;

  /** List of segment definitions that make up this message */
  segments: SegmentDefinition[];
}
