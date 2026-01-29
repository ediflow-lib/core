import type { ValidationResult } from '../validation';

/**
 * Validation Context
 *
 * Provides additional context for validation (e.g., repository-specific rules).
 */
export interface ValidationContext {
  /** Repository identifier (for custom rules per repository) */
  repositoryId?: string;

  /** Message-specific metadata */
  metadata?: Record<string, unknown>;

  /** Whether to apply strict validation */
  strict?: boolean;
}

/**
 * Domain Service Interface for Validation
 *
 * Defines the contract for validating domain entities.
 * This is a Domain Service Interface (Port in Domain Layer).
 *
 * Pattern: Strategy Pattern + Chain of Responsibility
 * - Different validators can be swapped (Strategy)
 * - Multiple validators can be chained (Chain of Responsibility)
 *
 * Implementations:
 * - Application Layer: Format-specific validators (EDIFACT, X12, etc.)
 * - Infrastructure Layer: Custom rule engines
 */
export interface IValidationService<T> {
  /**
   * Validates a domain entity against business rules.
   *
   * @param entity - The entity to validate
   * @param context - Optional validation context (for custom rules)
   * @returns Validation result with errors if any
   */
  validate(entity: T, context?: ValidationContext): ValidationResult;
}
