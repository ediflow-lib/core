/**
 * EDIElement Entity
 *
 * Represents a data element (simple or composite).
 */
export class EDIElement {
  constructor(
    public readonly value: string,
    public readonly components: string[] = []
  ) {}

  isComposite(): boolean {
    return this.components.length > 0;
  }
}
