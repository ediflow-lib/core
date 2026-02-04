/**
 * EDIFACT Parser Barrel Export
 *
 * ⚠️ DEPRECATION NOTICE
 *
 * These EDIFACT parsers are deprecated. Use @ediflow/edifact package instead.
 * They will be removed from @ediflow/core in v1.0.0.
 *
 * @deprecated Use @ediflow/edifact package instead (available now!)
 *
 * Migration path:
 * ```bash
 * # Install the new package:
 * npm install @ediflow/edifact
 * ```
 *
 * Code migration:
 * ```typescript
 * // Old (deprecated):
 * import { EdifactMessageParser } from '@ediflow/core/infrastructure';
 *
 * // New (recommended):
 * import { EdifactMessageParser } from '@ediflow/edifact';
 * ```
 *
 * Timeline:
 * - Sprint 9: @ediflow/edifact package available ✅
 * - Sprint 9: This deprecation notice added ⚠️
 * - v1.0.0: EDIFACT parsers removed from core 💥
 *
 * Your code will continue to work until v1.0.0!
 */

export * from './EdifactMessageParser';
export * from './EdifactDelimiterDetector';
export * from './EdifactTokenizer';
export * from './EdifactSegmentParser';
