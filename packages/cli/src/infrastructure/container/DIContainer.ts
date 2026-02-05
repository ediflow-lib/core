import { UseCaseFactory, EDIMessageValidationService } from '@ediflow/core';
import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser
} from '@ediflow/edifact';

/**
 * Dependency Injection Container for CLI Package
 *
 * Infrastructure Layer - Wires concrete implementations from format packages
 * into the Application Layer (Use Cases from Core)
 */
export class DIContainer {
  private static instance: DIContainer;
  private readonly useCaseFactory: UseCaseFactory;

  private constructor() {
    // Create EDIFACT parser with all dependencies
    const edifactDelimiterDetector = new EdifactDelimiterDetector();
    const edifactTokenizer = new EdifactTokenizer();
    const edifactSegmentParser = new EdifactSegmentParser();
    const edifactParser = new EdifactMessageParser(
      edifactDelimiterDetector,
      edifactTokenizer,
      edifactSegmentParser
    );

    // Create parsers map (strategy pattern for multi-format support)
    const parsers = new Map();
    parsers.set('EDIFACT', edifactParser);
    // Future: parsers.set('X12', x12Parser);

    // Create validation service
    const validationService = new EDIMessageValidationService();

    // Initialize Use Case Factory with parsers map and validation service
    this.useCaseFactory = new UseCaseFactory(parsers, validationService);
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
