/**
 * ValidationContext
 *
 * Tracks the current path in MessageStructure for detailed error messages.
 * Maintains group hierarchy and segment indices for error reporting.
 */
export class ValidationContext {
  public path: string[] = [];
  private segmentIndex: Map<string, number> = new Map();

  enterGroup(groupId: string): void {
    this.path.push(groupId);
  }

  exitGroup(): void {
    this.path.pop();
    if (this.path.length === 0) {
      this.segmentIndex.clear();
    }
  }

  getPath(segmentTag: string): string {
    const key = this.path.length > 0
      ? `${this.path.join('.')}.${segmentTag}`
      : segmentTag;

    const index = this.segmentIndex.get(key) || 0;
    this.segmentIndex.set(key, index + 1);

    if (this.path.length > 0) {
      return `${this.path.join('.')}.${segmentTag}[${index}]`;
    }
    return `${segmentTag}[${index}]`;
  }

  reset(): void {
    this.path = [];
    this.segmentIndex.clear();
  }
}
