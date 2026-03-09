import type {
  MessageFile,
  MessageStructureNode,
  SegmentReference,
  SegmentGroupStructure,
  SegmentDefinition,
  ElementDefinition,
  CompositeDefinition
} from './models/DataPackageModels';

export type DataPackageIssueType = 'missing-segment' | 'missing-element' | 'missing-composite';

export interface DataPackageIssue {
  type: DataPackageIssueType;
  segmentTag?: string;
  code?: string;
  message: string;
}

export interface DataPackageValidationResult {
  hasIssues: boolean;
  issues: DataPackageIssue[];
}

/**
 * DataPackageValidator
 *
 * Validates a MessageFile against the loaded Data Package definitions.
 * Traverses the entire structure recursively and collects ALL issues —
 * does not stop at the first error.
 *
 * Deduplicates issues — repeated references to the same missing
 * segment/element/composite are reported only once.
 */
export class DataPackageValidator {
  private readonly checkedSegments = new Set<string>();

  constructor(
    private readonly segments: Record<string, SegmentDefinition>,
    private readonly elements: Record<string, ElementDefinition>,
    private readonly composites: Record<string, CompositeDefinition>
  ) {}

  validate(messageFile: MessageFile): DataPackageIssue[] {
    this.checkedSegments.clear();
    const issues: DataPackageIssue[] = [];
    this.collectIssues(messageFile.structure, issues);
    return issues;
  }

  validateWithResult(messageFile: MessageFile): DataPackageValidationResult {
    const issues = this.validate(messageFile);
    return { hasIssues: issues.length > 0, issues };
  }

  private collectIssues(nodes: MessageStructureNode[], issues: DataPackageIssue[]): void {
    for (const node of nodes) {
      if (node.nodeType === 'segment') {
        this.validateSegmentRef(node, issues);
      } else {
        this.validateSegmentGroup(node, issues);
      }
    }
  }

  private validateSegmentRef(ref: SegmentReference, issues: DataPackageIssue[]): void {
    if (this.checkedSegments.has(ref.segmentRef)) {
      return;
    }
    this.checkedSegments.add(ref.segmentRef);

    const segmentDef = this.segments[ref.segmentRef];
    if (!segmentDef) {
      issues.push({
        type: 'missing-segment',
        segmentTag: ref.segmentRef,
        message: `Segment definition not found: ${ref.segmentRef}`
      });
      return;
    }

    this.validateSegmentElements(segmentDef, issues);
  }

  private validateSegmentGroup(group: SegmentGroupStructure, issues: DataPackageIssue[]): void {
    this.collectIssues(group.structure, issues);
  }

  private validateSegmentElements(segmentDef: SegmentDefinition, issues: DataPackageIssue[]): void {
    for (const el of segmentDef.elements) {
      if (el.nodeType === 'element') {
        this.validateElementCode(el.elementCode, segmentDef.tag, issues);
      } else {
        this.validateCompositeCode(el.compositeCode, segmentDef.tag, issues);
      }
    }
  }

  private validateElementCode(code: string, segmentTag: string, issues: DataPackageIssue[]): void {
    if (!this.elements[code]) {
      issues.push({
        type: 'missing-element',
        segmentTag,
        code,
        message: `Element definition not found: ${code} (in segment ${segmentTag})`
      });
    }
  }

  private validateCompositeCode(code: string, segmentTag: string, issues: DataPackageIssue[]): void {
    const compositeDef = this.composites[code];
    if (!compositeDef) {
      issues.push({
        type: 'missing-composite',
        segmentTag,
        code,
        message: `Composite definition not found: ${code} (in segment ${segmentTag})`
      });
      return;
    }

    for (const comp of compositeDef.components) {
      this.validateElementCode(comp.elementCode, segmentTag, issues);
    }
  }
}

