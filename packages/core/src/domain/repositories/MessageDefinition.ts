import type { Standard } from '../value-objects';

export interface DataElementDefinition {
  code: string;
  name: string;
  description?: string;
  type: 'an' | 'a' | 'n';
  minLength?: number;
  maxLength: number;
  codeListCode?: string;
}

export interface CompositeElementDefinition {
  code: string;
  name: string;
  description?: string;
  components: Array<{
    position: number;
    elementCode: string;
    name: string;
    mandatory: boolean;
  }>;
}

export interface SegmentElementReference {
  position: number;
  elementCode: string;
  name: string;
  type: string;
  mandatory: boolean;
}

export interface SegmentDefinition {
  tag: string;
  name: string;
  description?: string;
  elements: SegmentElementReference[];
}

export interface SegmentGroupDefinition {
  id: string;
  name: string;
  triggerSegment: string;
  mandatory: boolean;
  maxOccurrences: number;
  segments: Array<{
    tag: string;
    mandatory: boolean;
    maxOccurrences: number;
  }>;
  subGroups?: SegmentGroupDefinition[];
}

export interface MessageSegmentReference {
  tag: string;
  name: string;
  mandatory: boolean;
  maxOccurrences: number;
  position: number;
}

export interface MessageDefinition {
  standard: Standard;
  version: string;
  messageType: string;
  name: string;
  description?: string;
  segments: MessageSegmentReference[];
  segmentGroups?: SegmentGroupDefinition[];
}

export interface CodeListDefinition {
  code: string;
  name: string;
  description?: string;
  values: Array<{
    value: string;
    name: string;
    description?: string;
  }>;
}
