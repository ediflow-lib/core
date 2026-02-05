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
    mandatory: boolean;
  }>;
}

export interface SegmentElementReference {
  position: number;
  elementCode: string;
  name: string;
  mandatory: boolean;
  maxOccurrences?: number;
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

export interface SegmentReference {
  tag: string;
  name: string;
  mandatory: boolean;
  maxOccurrences: number;
  position: number;
}

export interface MessageDefinition {
  standard: string;
  version: string;
  messageType: string;
  name: string;
  description?: string;
  segments: SegmentReference[];
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
