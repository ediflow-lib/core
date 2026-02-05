import {
  EDIMessage,
  Standard,
  Version,
  MessageType,
  EDISegment,
  Delimiters,
  IDelimiterDetector,
  ITokenizer,
  IMessageParser,
  ParserConfig
} from '@ediflow/core';
import type { EdifactSegmentParser } from './EdifactSegmentParser';

/**
 * Parser for complete EDIFACT messages.
 * Orchestrates delimiter detection, tokenization, and segment parsing
 * to create EDIMessage objects from EDIFACT strings.
 */
export class EdifactMessageParser implements IMessageParser {
  private lastParserConfig: ParserConfig = {
    propertyParseMode: 'code',
    codeListValueParseMode: 'code',
  };

  constructor(
    private readonly delimiterDetector: IDelimiterDetector,
    private readonly tokenizer: ITokenizer,
    private readonly segmentParser: EdifactSegmentParser
  ) {}

  /**
   * Parses a complete EDIFACT message string into an EDIMessage object.
   *
   * @param ediString - The complete EDIFACT message string
   * @param config - Optional parser configuration for controlling parsing behavior
   * @returns Parsed EDIMessage with all segments and metadata
   *
   * @example
   * const edifact = "UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123'UNT+3+1'";
   * const message = parser.parse(edifact);
   * // message.messageType === "ORDERS"
   * // message.version === "D.96A"
   * // message.segments.length === 3
   */
  parse(ediString: string, config?: ParserConfig): EDIMessage {
    // TODO: Use config for controlling parsing behavior (propertyParseMode, codeListValueParseMode)
    // Currently not used but will be needed for advanced parsing features

    this.validateMessage(ediString);

    // Detect delimiters from message (or use provided ones from config)
    const delimiters = config?.delimiters || this.delimiterDetector.detect(ediString);

    // Store configuration for later retrieval
    this.lastParserConfig = {
      propertyParseMode: config?.propertyParseMode || 'code',
      codeListValueParseMode: config?.codeListValueParseMode || 'code',
      delimiters
    };


    const segmentStrings = this.tokenizer.tokenize(ediString, delimiters);

    const segments = this.parseAllSegments(segmentStrings, delimiters);

    const unhSegment = this.findUNHSegment(segments);
    const { version, messageType } = this.extractMetadata(unhSegment, delimiters);

    const message = new EDIMessage(Standard.EDIFACT, version, messageType);

    segments.forEach(segment => message.addSegment(segment));

    return message;
  }

  /**
   * Validates that the EDI message string is not empty.
   */
  private validateMessage(ediString: string): void {
    if (!ediString || ediString.trim().length === 0) {
      throw new Error('EDI message cannot be empty');
    }
  }

  /**
   * Parses all segment strings into EDISegment objects.
   */
  private parseAllSegments(segmentStrings: string[], delimiters: Delimiters): EDISegment[] {
    return segmentStrings.map(segmentString =>
      this.segmentParser.parseSegment(segmentString, delimiters)
    );
  }

  /**
   * Finds the UNH (Message Header) segment.
   * UNH is mandatory in EDIFACT messages and contains version and message type.
   */
  private findUNHSegment(segments: EDISegment[]): EDISegment {
    const unhSegment = segments.find(segment => segment.tag === 'UNH');

    if (!unhSegment) {
      throw new Error('UNH segment not found in EDIFACT message');
    }

    return unhSegment;
  }

  /**
   * Extracts message metadata (version and type) from UNH segment.
   *
   * UNH segment format: UNH+reference+type:version:release:agency:association
   * Example: UNH+1+ORDERS:D:96A:UN:EAN008
   *
   * We extract:
   * - Message type: ORDERS
   * - Version: D.96A (formatted as D.{release})
   */
  private extractMetadata(unhSegment: EDISegment, delimiters: Delimiters): { version: Version; messageType: MessageType } {
    if (unhSegment.elements.length < 2) {
      throw new Error('Invalid UNH segment: missing message identifier');
    }

    const messageIdentifier = unhSegment.elements[1];
    if (!messageIdentifier) {
      throw new Error('Invalid UNH segment: message identifier is empty');
    }


    const components = messageIdentifier.value.split(delimiters.component);

    if (components.length < 3) {
      throw new Error('Invalid UNH segment: message identifier must have at least 3 components');
    }

    const messageTypeCode = components[0];
    const versionLetter = components[1];
    const releaseNumber = components[2];

    if (!messageTypeCode || !versionLetter || !releaseNumber) {
      throw new Error('Invalid UNH segment: missing required components');
    }

    const versionString = `${versionLetter}.${releaseNumber}`;

    const messageType = new MessageType(Standard.EDIFACT, messageTypeCode);
    const version = new Version(Standard.EDIFACT, versionString);

    return { version, messageType };
  }

  /**
   * Returns the EDI standard this parser supports.
   */
  getSupportedStandard(): Standard {
    return Standard.EDIFACT;
  }

  /**
   * Checks if this parser can parse the given EDI string.
   * For EDIFACT, we check for the presence of UNH segment.
   */
  canParse(ediString: string): boolean {
    if (!ediString || ediString.trim().length === 0) {
      return false;
    }
    // Simple check: EDIFACT messages should contain 'UNH'
    return ediString.includes('UNH');
  }

  /**
   * Returns the parser configuration used in the last parse operation.
   * Contains detected delimiters and other parsing metadata.
   */
  getConfiguration(): ParserConfig {
    return this.lastParserConfig;
  }
}
