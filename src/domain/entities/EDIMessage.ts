import { Standard } from '../value-objects/Standard';
import { Version } from '../value-objects/Version';
import { MessageType } from '../value-objects/MessageType';
import { EDISegment } from './EDISegment';

/**
 * EDIMessage Entity
 *
 * Core domain entity representing an EDI message with metadata and segments.
 * Supports segment groups for hierarchical structures (e.g., EDIFACT SG1, SG10).
 */
export class EDIMessage {
  private readonly _segments: EDISegment[] = [];
  private readonly _segmentGroups: Map<string, EDISegment[]> = new Map();

  constructor(
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
}
