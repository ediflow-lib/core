import { EDISegment } from '@domain/entities/EDISegment';
import { EDIElement } from '@domain/entities/EDIElement';

/**
 * Domain Service: EnvelopeGenerator
 *
 * Generates EDIFACT envelope segments (UNH/UNT/UNB/UNZ) for all message types.
 *
 * EDIFACT Envelope Structure (Currently Supported):
 * - UNA: Service String Advice (optional, defines delimiters)
 * - UNB: Interchange Header (wraps entire interchange) ✅
 * - UNH: Message Header (wraps individual message) ✅
 * - [Business Segments...]
 * - UNT: Message Trailer (includes segment count) ✅
 * - UNZ: Interchange Trailer (includes message count) ✅
 *
 * EDIFACT Envelope Structure (Full Specification):
 * - UNA: Service String Advice (optional)
 * - UNB: Interchange Header (REQUIRED)
 * - UNG: Functional Group Header (OPTIONAL, not yet implemented)
 * - UNH: Message Header (REQUIRED)
 * - [Business Segments...]
 * - UNT: Message Trailer (REQUIRED)
 * - UNE: Functional Group Trailer (OPTIONAL, not yet implemented)
 * - UNZ: Interchange Trailer (REQUIRED)
 *
 * Known Limitations (M1):
 * - UNG/UNE (Functional Groups) not yet supported
 * - Covers 95%+ of real-world EDIFACT use cases
 * - UNG/UNE planned for M2/M3 if needed (see US-9.x)
 *
 * This service is message-type agnostic and can be used for:
 * ORDERS, DESADV, INVOIC, IFTMIN, PRICAT, etc.
 *
 * Clean Architecture:
 * - Domain Service (not an Entity!)
 * - Pure functions, no side effects
 * - Reusable across all message types
 * - No dependencies on infrastructure
 * - Extensible for UNG/UNE support in future
 */
export class EnvelopeGenerator {
  /**
   * Generate UNH (Message Header) segment
   *
   * Format: UNH+{messageRef}+{messageType}:{release}:{version}:{agency}'
   * Example: UNH+1+ORDERS:D:96A:UN'
   *
   * @param messageType - EDIFACT message type (ORDERS, DESADV, INVOIC, etc.)
   * @param version - EDIFACT version (D.96A, D.01B, D.20B, etc.)
   * @param messageRef - Unique message reference number
   * @returns EDISegment with tag 'UNH'
   */
  generateUNH(messageType: string, version: string, messageRef: string): EDISegment {
    const versionCode = this.formatVersionCode(version);

    const messageRefElement = new EDIElement(messageRef);
    const messageIdentifier = new EDIElement('', [messageType, 'D', versionCode, 'UN']);

    return new EDISegment('UNH', [messageRefElement, messageIdentifier]);
  }

  /**
   * Generate UNT (Message Trailer) segment
   *
   * Format: UNT+{segmentCount}+{messageRef}'
   * Example: UNT+15+1'
   *
   * Note: segmentCount includes UNH + business segments + UNT itself
   *
   * @param segmentCount - Total number of segments in message (including UNH and UNT)
   * @param messageRef - Message reference number (must match UNH)
   * @returns EDISegment with tag 'UNT'
   */
  generateUNT(segmentCount: number, messageRef: string): EDISegment {
    const countElement = new EDIElement(segmentCount.toString());
    const refElement = new EDIElement(messageRef);

    return new EDISegment('UNT', [countElement, refElement]);
  }

  /**
   * Generate UNB (Interchange Header) segment
   *
   * Format: UNB+UNOC:3+{sender}:ZZ+{receiver}:ZZ+{date}:{time}+{controlRef}'
   * Example: UNB+UNOC:3+SENDER:ZZ+RECEIVER:ZZ+210124:1200+REF001'
   *
   * @param sender - Sender identification
   * @param receiver - Receiver identification
   * @param dateTime - Date and time of interchange creation
   * @param controlRef - Interchange control reference
   * @returns EDISegment with tag 'UNB'
   */
  generateUNB(
    sender: string,
    receiver: string,
    dateTime: Date,
    controlRef: string
  ): EDISegment {
    const syntaxIdentifier = new EDIElement('', ['UNOC', '3']);
    const senderElement = new EDIElement('', [sender, 'ZZ']);
    const receiverElement = new EDIElement('', [receiver, 'ZZ']);
    const dateTimeElement = this.formatDateTime(dateTime);
    const controlRefElement = new EDIElement(controlRef);

    return new EDISegment('UNB', [
      syntaxIdentifier,
      senderElement,
      receiverElement,
      dateTimeElement,
      controlRefElement
    ]);
  }

  /**
   * Generate UNZ (Interchange Trailer) segment
   *
   * Format: UNZ+{messageCount}+{controlRef}'
   * Example: UNZ+1+REF001'
   *
   * @param messageCount - Number of messages in interchange (usually 1)
   * @param controlRef - Interchange control reference (must match UNB)
   * @returns EDISegment with tag 'UNZ'
   */
  generateUNZ(messageCount: number, controlRef: string): EDISegment {
    const countElement = new EDIElement(messageCount.toString());
    const refElement = new EDIElement(controlRef);

    return new EDISegment('UNZ', [countElement, refElement]);
  }

  /**
   * Format EDIFACT version code
   *
   * Converts "D.96A" → "96A", "D.20B" → "20B"
   */
  private formatVersionCode(version: string): string {
    return version.replace('D.', '');
  }

  /**
   * Format date/time for EDIFACT UNB segment
   *
   * Format: YYMMDD:HHMM (UTC)
   * Example: 210124:1200
   */
  private formatDateTime(date: Date): EDIElement {
    const year = date.getUTCFullYear().toString().slice(-2);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    const dateStr = `${year}${month}${day}`;
    const timeStr = `${hours}${minutes}`;

    return new EDIElement('', [dateStr, timeStr]);
  }
}
