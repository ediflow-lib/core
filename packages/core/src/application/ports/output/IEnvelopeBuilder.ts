import { EDIMessage, MessageType, Version, Standard } from '@domain';

/**
 * Port (Interface) for wrapping messages with envelope segments.
 *
 * This interface is format-agnostic and works for:
 * - EDIFACT: UNH/UNT (message) and UNB/UNZ (interchange)
 * - X12: ST/SE (transaction set) and ISA/IEA (interchange), GS/GE (functional group)
 * - Future formats
 *
 * The builder works on STRUCTURE level (EDIMessage objects), NOT string level!
 *
 * Implementation examples:
 * - EdifactEnvelopeBuilder (packages/edifact)
 * - X12EnvelopeBuilder (packages/x12)
 */
export interface IEnvelopeBuilder {
  /**
   * Wraps a message with message-level envelope.
   *
   * EDIFACT: Adds UNH (header) and UNT (trailer) segments
   * X12: Adds ST (transaction set header) and SE (transaction set trailer) segments
   *
   * @param message - The business message to wrap (without envelope)
   * @param options - Envelope configuration
   * @returns New EDIMessage with envelope segments added
   *
   * @example EDIFACT
   * ```typescript
   * // Input: [BGM, DTM, NAD] (3 segments)
   * const result = builder.wrapMessage(message, {
   *   messageRef: '1',
   *   messageType: 'INVOIC',
   *   version: 'D96A'
   * });
   * // Output: [UNH, BGM, DTM, NAD, UNT] (5 segments)
   * // UNH+1+INVOIC:D:96A:UN'
   * // UNT+5+1'
   * ```
   *
   * @example X12
   * ```typescript
   * // Input: [BEG, REF, DTM] (3 segments)
   * const result = builder.wrapMessage(message, {
   *   messageRef: '0001',
   *   messageType: '810',  // Invoice
   *   version: '4010'
   * });
   * // Output: [ST, BEG, REF, DTM, SE] (5 segments)
   * // ST*810*0001~
   * // SE*5*0001~
   * ```
   */
  wrapMessage(
    message: EDIMessage,
    options: MessageEnvelopeOptions
  ): EDIMessage;

  /**
   * Wraps messages with interchange-level envelope.
   *
   * EDIFACT: Adds UNB (interchange header) and UNZ (interchange trailer)
   * X12: Adds ISA (interchange header) and IEA (interchange trailer)
   *
   * Note: X12 also requires GS/GE (functional group) - implementation handles this!
   *
   * @param messages - Array of messages to wrap (should already have message envelopes!)
   * @param options - Interchange configuration
   * @returns New EDIMessage with all messages wrapped in interchange envelope
   *
   * @example EDIFACT
   * ```typescript
   * // Input: [[UNH, BGM, UNT], [UNH, ORDERS, UNT]] (2 messages)
   * const result = builder.wrapInterchange(messages, {
   *   controlRef: 'REF123',
   *   sender: 'SENDER',
   *   receiver: 'RECEIVER',
   *   dateTime: new Date()
   * });
   * // Output: [UNB, [UNH, BGM, UNT], [UNH, ORDERS, UNT], UNZ]
   * // UNB+UNOC:3+SENDER+RECEIVER+250207:1234+REF123'
   * // UNZ+2+REF123'
   * ```
   *
   * @example X12
   * ```typescript
   * // Input: [[ST, BEG, SE], [ST, PO1, SE]] (2 transaction sets)
   * const result = builder.wrapInterchange(messages, {
   *   controlRef: '000000001',
   *   sender: 'SENDER123',
   *   receiver: 'RECEIVER456',
   *   dateTime: new Date()
   * });
   * // Output: [ISA, GS, [ST, BEG, SE], [ST, PO1, SE], GE, IEA]
   * // ISA*00*          *00*          *ZZ*SENDER123      *ZZ*RECEIVER456    *250207*1234*U*00401*000000001*0*P*:~
   * // GS*IN*SENDER123*RECEIVER456*20250207*1234*1*X*004010~
   * // GE*2*1~
   * // IEA*1*000000001~
   * ```
   */
  wrapInterchange(
    messages: EDIMessage[],
    options: InterchangeEnvelopeOptions
  ): EDIMessage;

  /**
   * Returns the EDI standard this builder supports.
   *
   * Used by the framework to route messages to the correct builder.
   *
   * @returns Standard.EDIFACT or Standard.X12
   */
  getSupportedStandard(): Standard;
}

/**
 * Options for message-level envelope wrapping.
 *
 * Format-agnostic - works for all EDI standards.
 */
export interface MessageEnvelopeOptions {
  /**
   * Message reference number.
   *
   * EDIFACT: Used in UNH (element 0062) and UNT (element 0062)
   * X12: Used in ST (ST02) and SE (SE02)
   *
   * Examples:
   * - EDIFACT: '1', '2', '12345'
   * - X12: '0001', '0002', '12345'
   */
  messageRef: string;

  /**
   * Message type / Transaction set identifier.
   *
   * EDIFACT: 6-character message type (e.g., 'INVOIC', 'ORDERS', 'DESADV')
   * X12: 3-digit transaction set code (e.g., '810', '850', '856')
   *
   * Examples:
   * - EDIFACT: 'INVOIC' (Invoice), 'ORDERS' (Purchase Order)
   * - X12: '810' (Invoice), '850' (Purchase Order), '856' (Ship Notice)
   */
  messageType: MessageType;

  /**
   * Message version / Release.
   *
   * EDIFACT: Directory version (e.g., 'D96A', 'D01B', 'D20B')
   * X12: Version/Release (e.g., '4010', '5010')
   *
   * Examples:
   * - EDIFACT: 'D96A', 'D01B', 'D12A', 'D20B'
   * - X12: '4010', '4030', '5010', '5030'
   */
  version: Version;
}

/**
 * Options for interchange-level envelope wrapping.
 *
 * Format-agnostic - works for all EDI standards.
 */
export interface InterchangeEnvelopeOptions {
  /**
   * Interchange control reference number.
   *
   * EDIFACT: Used in UNB (element 0020) and UNZ (element 0020)
   * X12: Used in ISA (ISA13) and IEA (IEA02)
   *
   * Must be unique for each interchange.
   *
   * Examples:
   * - EDIFACT: 'REF123', '20250207001', any string
   * - X12: '000000001', '123456789' (typically 9 digits, zero-padded)
   */
  controlRef: string;

  /**
   * Sender identifier.
   *
   * EDIFACT: Interchange sender (UNB S002)
   * X12: Interchange sender ID (ISA06)
   *
   * Format depends on standard and qualifier:
   * - EDIFACT: Can be any identifier (GLN, DUNS, etc.)
   * - X12: 15 characters, space-padded (e.g., 'SENDER123      ')
   *
   * Examples:
   * - EDIFACT: 'SENDER123', '5412345000013' (GLN)
   * - X12: 'SENDER123' (will be padded to 15 chars)
   */
  sender: string;

  /**
   * Receiver identifier.
   *
   * EDIFACT: Interchange receiver (UNB S003)
   * X12: Interchange receiver ID (ISA08)
   *
   * Format depends on standard and qualifier:
   * - EDIFACT: Can be any identifier (GLN, DUNS, etc.)
   * - X12: 15 characters, space-padded (e.g., 'RECEIVER456    ')
   *
   * Examples:
   * - EDIFACT: 'RECEIVER456', '5412345000020' (GLN)
   * - X12: 'RECEIVER456' (will be padded to 15 chars)
   */
  receiver: string;

  /**
   * Interchange date and time.
   *
   * EDIFACT: Used in UNB S004 (date and time)
   * X12: Used in ISA (ISA09 = date, ISA10 = time)
   *
   * Format will be converted by implementation:
   * - EDIFACT: YYMMDD:HHMM (e.g., '250207:1234')
   * - X12: YYMMDD for date (ISA09), HHMM for time (ISA10)
   *
   * @default new Date() (current date/time)
   */
  dateTime: Date;

  /**
   * Application reference (optional).
   *
   * EDIFACT: Application reference (UNB S005) - optional
   * X12: Application sender/receiver codes (GS02/GS03) - optional
   *
   * If not provided, implementation may use sender/receiver or default values.
   */
  applicationRef?: string;

  /**
   * Test indicator (optional).
   *
   * EDIFACT: Test indicator (UNB element 0035) - optional
   * X12: Usage indicator (ISA15): P=Production, T=Test
   *
   * @default false (production)
   */
  isTest?: boolean;
}
