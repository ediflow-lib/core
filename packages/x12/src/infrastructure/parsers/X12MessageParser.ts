/**
 * X12 Message Parser
 *
 * Main parser for X12 EDI messages. Implements IMessageParser interface.
 * Integrates tokenizer, segment parser, and envelope parser to create EDIMessage entities.
 *
 * @module X12MessageParser
 * @see Story #49
 */

import {
  EDIMessage,
  Standard,
  Version,
  MessageType,
  IDelimiterDetector,
  IMessageParser,
  ParserConfig,
  EDIMessageFactory
} from '@ediflow/core';
import type { X12SegmentParser } from './X12SegmentParser';
import type { X12EnvelopeParser } from './X12EnvelopeParser';
import type { X12FunctionalGroup } from './X12EnvelopeParser';

export class X12MessageParser implements IMessageParser {
  private lastParserConfig: ParserConfig = {
    propertyParseMode: 'code',
    codeListValueParseMode: 'code',
  };

  constructor(
    private readonly delimiterDetector: IDelimiterDetector,
    private readonly segmentParser: X12SegmentParser,
    private readonly envelopeParser: X12EnvelopeParser
  ) {}

  parse(ediString: string, config?: ParserConfig): EDIMessage {
    this.validateMessage(ediString);

    const delimiters = config?.delimiters || this.delimiterDetector.detect(ediString);

    this.lastParserConfig = {
      propertyParseMode: config?.propertyParseMode || 'code',
      codeListValueParseMode: config?.codeListValueParseMode || 'code',
      delimiters
    };

    const segmentStrings = this.tokenizeMessage(ediString, delimiters);
    const segments = segmentStrings.map(str =>
      this.segmentParser.parseSegment(str, delimiters)
    );

    const interchange = this.envelopeParser.parse(segments);

    if (interchange.functionalGroups.length === 0) {
      throw new Error('No functional groups found in X12 message');
    }

    const firstGroup = interchange.functionalGroups[0];
    if (!firstGroup || firstGroup.transactionSets.length === 0) {
      throw new Error('No transaction sets found in X12 message');
    }

    const { version, messageType } = this.extractMetadata(firstGroup);

    const message = EDIMessageFactory.create({
      standard: Standard.X12,
      version,
      messageType
    });

    this.addAllSegmentsToMessage(message, interchange.functionalGroups);

    return message;
  }

  private addAllSegmentsToMessage(message: EDIMessage, functionalGroups: X12FunctionalGroup[]): void {
    for (const group of functionalGroups) {
      this.addGroupSegmentsToMessage(message, group);
    }
  }

  private addGroupSegmentsToMessage(message: EDIMessage, group: X12FunctionalGroup): void {
    for (const transactionSet of group.transactionSets) {
      this.addTransactionSetSegmentsToMessage(message, transactionSet);
    }
  }

  private addTransactionSetSegmentsToMessage(message: EDIMessage, transactionSet: any): void {
    message.addSegment(transactionSet.st);
    for (const segment of transactionSet.segments) {
      message.addSegment(segment);
    }
    message.addSegment(transactionSet.se);
  }

  private validateMessage(ediString: string): void {
    if (!ediString || ediString.trim().length === 0) {
      throw new Error('EDI message cannot be empty');
    }
  }

  private tokenizeMessage(ediString: string, delimiters: any): string[] {
    return ediString
      .split(delimiters.segment)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private extractMetadata(firstGroup: X12FunctionalGroup): { version: Version; messageType: MessageType } {
    const gsSegment = firstGroup.gs;
    if (!gsSegment) {
      throw new Error('GS segment not found');
    }

    const versionElement = gsSegment.elements[7];
    if (!versionElement) {
      throw new Error('Version not found in GS segment');
    }

    const firstTransaction = firstGroup.transactionSets[0];
    if (!firstTransaction) {
      throw new Error('No transaction set found');
    }

    const stSegment = firstTransaction.st;
    if (!stSegment) {
      throw new Error('ST segment not found');
    }

    const messageTypeElement = stSegment.elements[0];
    if (!messageTypeElement) {
      throw new Error('Message type not found in ST segment');
    }

    const version = new Version(Standard.X12, versionElement.value);

    // ST03 (Implementation Convention Reference) identifies HIPAA message subtype
    // e.g. 005010X222A1 -> 837-Q1 (Professional Claims)
    const st03Element = stSegment.elements[2];
    const qualifiedMessageType = this.resolveMessageType(
      messageTypeElement.value,
      st03Element?.value
    );
    const messageType = new MessageType(Standard.X12, qualifiedMessageType);

    return { version, messageType };
  }

  /**
   * Resolves the full message type including HIPAA qualifier from ST03.
   * ST03 format: {version}{implementationGuideId}  e.g. 005010X222A1
   * Returns qualified type like '837-Q1' when ST03 is present and recognized.
   */
  private resolveMessageType(baseType: string, st03?: string): string {
    if (!st03) {
      return baseType;
    }
    const qualifier = HipaaConventionRegistry.getQualifier(st03);
    return qualifier ? `${baseType}-${qualifier}` : baseType;
  }

  getSupportedStandard(): Standard {
    return Standard.X12;
  }

  canParse(ediString: string): boolean {
    if (!ediString || ediString.trim().length === 0) {
      return false;
    }
    return ediString.startsWith('ISA');
  }

  getConfiguration(): ParserConfig {
    return this.lastParserConfig;
  }
}

/**
 * Maps HIPAA ST03 Implementation Convention Reference values to message type qualifiers.
 * ST03 is the 3rd element of the ST segment (e.g. ST*837*0001*005010X222A1~).
 * Source: HIPAA 005010 Implementation Guides
 */
class HipaaConventionRegistry {
  private static readonly ST03_TO_QUALIFIER = new Map<string, string>([
    ['005010X222A1', 'Q1'],   // 837P Professional Claims
    ['005010X223A2', 'Q2'],   // 837D Dental Claims
    ['005010X223A3', 'Q3'],   // 837I Institutional Claims
    ['005010X279A1', 'B1'],   // 270/271 Eligibility
    ['005010X212',   'A1'],   // 276 Claim Status Request
    ['005010X214',   'A1'],   // 277 Status Notification
    ['005010X214B3', 'B3'],   // 277 Claim Acknowledgment
    ['005010X217',   'A1'],   // 278 Auth Request
    ['005010X217A3', 'A3'],   // 278 Auth Response
    ['005010X218',   'A1'],   // 820 Premium Payment
    ['005010X220A1', 'A1'],   // 834 Benefit Enrollment
    ['005010X221A1', 'W1'],   // 835 Claim Payment
    ['005010X231A1', 'A1'],   // 999 Implementation Acknowledgment
  ]);

  static getQualifier(st03: string): string | undefined {
    return this.ST03_TO_QUALIFIER.get(st03);
  }
}

