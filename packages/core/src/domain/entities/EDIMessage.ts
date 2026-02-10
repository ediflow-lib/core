import { Standard } from '@domain/value-objects';
import { Version } from '@domain/value-objects';
import { MessageType } from '@domain/value-objects';
import { EDISegment } from '@domain/value-objects';

/**
 * EDIMessage Entity (Aggregate Root)
 *
 * Core domain entity representing an EDI message with unique identity.
 * Supports segment groups for hierarchical structures (e.g., EDIFACT SG1, SG10).
 *
 * Entity Identity: Each message has a unique ID to track it through parsing,
 * validation, and building phases. This makes it a true Entity in DDD terms.
 */
export class EDIMessage {
  private readonly _segments: EDISegment[] = [];
  private readonly _segmentGroups: Map<string, EDISegment[]> = new Map();

  constructor(
    public readonly id: string,
    public readonly standard: Standard,
    public readonly version: Version,
    public readonly messageType: MessageType
  ) {}

  get segments(): readonly EDISegment[] {
    return this._segments;
  }

  addSegment(segment: EDISegment): void {
    this._segments.push(segment);
  }

  getSegmentsByTag(tag: string): EDISegment[] {
    return this._segments.filter((segment) => segment.tag === tag);
  }

  addToGroup(groupId: string, segment: EDISegment): void {
    if (!this._segmentGroups.has(groupId)) {
      this._segmentGroups.set(groupId, []);
    }
    this._segmentGroups.get(groupId)!.push(segment);
  }

  getSegmentsByGroup(groupId: string): EDISegment[] {
    return this._segmentGroups.get(groupId) ?? [];
  }

  isValid(): boolean {
    return this._segments.length > 0;
  }

  getSegmentCount(): number {
    return this._segments.length;
  }

  getGroupIds(): string[] {
    return Array.from(this._segmentGroups.keys());
  }

  /**
   * Compares two EDIMessage entities by their ID.
   * Two messages are equal if they have the same ID (Entity pattern).
   */
  equals(other: EDIMessage): boolean {
    return this.id === other.id;
  }
}
