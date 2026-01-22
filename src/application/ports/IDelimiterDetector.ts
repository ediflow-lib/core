import { Delimiters } from '../../domain/value-objects/Delimiters';

/**
 * IDelimiterDetector
 *
 * Port interface for detecting delimiters from EDI messages.
 * Implemented by format-specific detectors in Infrastructure Layer.
 *
 * Application Layer (Port)
 *
 * Purpose:
 * - Abstracts delimiter detection logic
 * - Allows different implementations per standard (EDIFACT UNA, X12 ISA, etc.)
 * - Follows Dependency Inversion Principle
 */
export interface IDelimiterDetector {
  /**
   * Detect delimiters from raw EDI message
   *
   * Priority:
   * 1. Extract from format-specific header (UNA for EDIFACT, ISA for X12)
   * 2. Fall back to standard defaults
   *
   * @param message - Raw EDI message string
   * @returns Detected delimiter configuration
   */
  detect(message: string): Delimiters;

  /**
   * Get message content without format-specific delimiter header
   *
   * Examples:
   * - EDIFACT: Remove UNA segment (first 9 characters if present)
   * - X12: Keep ISA segment (delimiters are within ISA)
   *
   * @param message - Raw EDI message string
   * @returns Message without format-specific header
   */
  getMessageWithoutFormatSpecificHeader(message: string): string;
}
