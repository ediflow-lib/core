/**
 * EDIElement Entity
 *
 * Represents a data element within an EDI segment.
 * Can be simple (single value) or composite (multiple components).
 */
export class EDIElement {
  constructor(
    public readonly value: string,
    public readonly components: string[] = []
  ) {}

  /**
   * Check if this element is composite (contains multiple components)
   */
  isComposite(): boolean {
    return this.components.length > 0;
  }
}
