import { EDIElement } from './EDIElement';

/**
 * EDISegment Entity
 *
 * Represents a segment with tag and data elements.
 */
export class EDISegment {
  constructor(
    public readonly tag: string,
    public readonly elements: EDIElement[]
  ) {}

  getElement(position: number): EDIElement | undefined {
    return this.elements[position];
  }

  getElementCount(): number {
    return this.elements.length;
  }
}
