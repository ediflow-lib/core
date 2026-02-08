import { UseCaseFactory, EDIMessageValidationService } from '@ediflow/core';
import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
  EdifactMessageBuilder
} from '@ediflow/edifact';

export class DIContainer {
  private static instance: DIContainer;
  public readonly useCaseFactory: UseCaseFactory;

  private constructor() {
    const edifactDelimiterDetector = new EdifactDelimiterDetector();
    const edifactTokenizer = new EdifactTokenizer();
    const edifactSegmentParser = new EdifactSegmentParser();
    const edifactParser = new EdifactMessageParser(
      edifactDelimiterDetector,
      edifactTokenizer,
      edifactSegmentParser
    );

    const edifactMessageBuilder = new EdifactMessageBuilder();

    const parsers = new Map();
    parsers.set('EDIFACT', edifactParser);

    const builders = new Map();
    builders.set('EDIFACT', edifactMessageBuilder);

    const validationService = new EDIMessageValidationService();

    this.useCaseFactory = new UseCaseFactory(parsers, builders, validationService);
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  getUseCaseFactory(): UseCaseFactory {
    return this.useCaseFactory;
  }
}
