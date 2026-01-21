import { Standard } from '../value-objects/Standard';
import { Version } from '../value-objects/Version';
import { MessageType } from '../value-objects/MessageType';
import { EDISegment } from './EDISegment';

/**
 * EDIMessage Entity
 *
 * Core domain entity representing an EDI message.
 * Contains metadata (standard, version, type) and segments.
 *
 * Supports segment groups for hierarchical structures (e.g., EDIFACT segment groups).
 *
 * @example
 * ```typescript
 * const message = new EDIMessage(
 *   Standard.EDIFACT,
 *   new Version(Standard.EDIFACT, 'D.20B'),
 *   new MessageType(Standard.EDIFACT, 'DESADV')
 * );
 *
 * message.addSegment(new EDISegment('UNH', [...]));
 * message.addToGroup('SG1', new EDISegment('NAD', [...]));
 * ```
 */
export class EDIMessage {
  private readonly _segments: EDISegment[] = [];
  private readonly _segmentGroups: Map<string, EDISegment[]> = new Map();

  constructor(
    public readonly standard: Standard,
    public readonly version: Version,
    public readonly messageType: MessageType
  ) {}

  /**
   * Get all segments in the message (flat list)
   */
  get segments(): readonly EDISegment[] {
    return this._segments;
  }

  /**
   * Add a segment to the message
   *
   * @param segment The segment to add
   */
  addSegment(segment: EDISegment): void {
    this._segments.push(segment);
  }

  /**
   * Get all segments with a specific tag
   *
   * @param tag The segment tag to search for (e.g., 'NAD', 'BGM')
   * @returns Array of matching segments
   */
  getSegmentsByTag(tag: string): EDISegment[] {
    return this._segments.filter((segment) => segment.tag === tag);
  }

  /**
   * Add a segment to a specific group (for EDIFACT segment groups like SG1, SG10)
   *
   * @param groupId The segment group identifier (e.g., 'SG1', 'SG10')
   * @param segment The segment to add to the group
   */
  addToGroup(groupId: string, segment: EDISegment): void {
    if (!this._segmentGroups.has(groupId)) {
      this._segmentGroups.set(groupId, []);
    }
    this._segmentGroups.get(groupId)!.push(segment);
  }

  /**
   * Get all segments in a specific group
   *
   * @param groupId The segment group identifier
   * @returns Array of segments in the group (empty if group doesn't exist)
   */
  getSegmentsByGroup(groupId: string): EDISegment[] {
    return this._segmentGroups.get(groupId) ?? [];
  }

  /**
   * Check if the message is valid (has at least one segment)
   *
   * @returns true if message has segments, false otherwise
   */
  isValid(): boolean {
    return this._segments.length > 0;
  }

  /**
   * Get the total number of segments in the message
   *
   * @returns The segment count
   */
  getSegmentCount(): number {
    return this._segments.length;
  }

  /**
   * Get all segment group IDs defined in this message
   *
   * @returns Array of group identifiers
   */
  getGroupIds(): string[] {
    return Array.from(this._segmentGroups.keys());
  }
}
