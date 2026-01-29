import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Fixture Loader for Integration Tests
 *
 * Provides utilities to load test fixtures from the fixtures directory.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load an EDI fixture file
 *
 * @param category - Fixture category ('happy-path', 'negative', 'performance')
 * @param filename - Fixture filename
 * @returns EDI string content
 */
export function loadEdifactFixture(category: string, filename: string): string {
  const fixturePath = join(__dirname, 'fixtures/edifact', category, filename);
  return readFileSync(fixturePath, 'utf-8').trim();
}

/**
 * Load happy path fixture (shorthand)
 */
export function loadValidFixture(filename: string): string {
  return loadEdifactFixture('happy-path', filename);
}

/**
 * Load negative fixture (shorthand)
 */
export function loadInvalidFixture(filename: string): string {
  return loadEdifactFixture('negative', filename);
}

/**
 * Generate a large EDIFACT message for performance testing
 *
 * @param lineItemCount - Number of LIN segments to generate
 * @returns Large EDIFACT message
 */
export function generateLargeOrdersMessage(lineItemCount: number): string {
  const header = "UNB+UNOC:3+SENDER:ZZ+RECEIVER:ZZ+210124:1200+REF001'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'DTM+137:20210124:102'";

  const lineItems: string[] = [];
  for (let i = 1; i <= lineItemCount; i++) {
    lineItems.push(`LIN+${i}++PROD${i.toString().padStart(6, '0')}:EN'QTY+21:${i}'PRI+AAA:${(i * 10.50).toFixed(2)}:CA'`);
  }

  const segmentCount = 5 + (lineItemCount * 3); // Header + items + trailer
  const trailer = `UNT+${segmentCount}+1'UNZ+1+REF001'`;

  return header + lineItems.join('') + trailer;
}
