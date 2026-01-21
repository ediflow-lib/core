import { EDIElement } from './EDIElement';

/**
 * EDISegment Entity
 *
 * Represents a segment within an EDI message.
 * A segment consists of a tag and multiple data elements.
 */
export class EDISegment {
  constructor(
    public readonly tag: string,
    public readonly elements: EDIElement[]
  ) {}

  /**
   * Get element at specific position (0-based)
   */
  getElement(position: number): EDIElement | undefined {
    return this.elements[position];
  }

  /**
   * Get number of elements in this segment
   */
  getElementCount(): number {
    return this.elements.length;
  }
}
