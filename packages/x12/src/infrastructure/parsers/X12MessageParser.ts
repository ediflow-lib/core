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
    const messageType = new MessageType(Standard.X12, messageTypeElement.value);

    return { version, messageType };
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
