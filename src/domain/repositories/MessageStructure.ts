/**
 * Composite Pattern for EDI Message Structure
 *
 * This design allows flexible hierarchical structures for any EDI standard:
 * - Elements (leaf)
 * - Composite Elements (composite of elements)
 * - Segments (contain elements/composites)
 * - Segment Groups (composite of segments/groups)
 * - Messages (composite of segments/groups)
 *
 * Order is preserved through array sequence.
 */


// ============================================================================
// ELEMENT LEVEL (Lowest Level)
// ============================================================================

export interface ElementNode {
  nodeType: 'element';
  code: string;
  name: string;
  mandatory: boolean;
  position: number;
  dataType?: string;
  maxLength?: number;
  codeListCode?: string;
}

export interface CompositeElementNode {
  nodeType: 'composite';
  code: string;
  name: string;
  mandatory: boolean;
  position: number;
  components: ElementNode[];
}

export type ElementOrComposite = ElementNode | CompositeElementNode;

// ============================================================================
// SEGMENT LEVEL
// ============================================================================

export interface SegmentNode {
  nodeType: 'segment';
  tag: string;
  name: string;
  mandatory: boolean;
  maxOccurrences: number;
  position: number;
  elements: ElementOrComposite[];
}

export interface SegmentGroupNode {
  nodeType: 'segmentGroup';
  id: string;
  name: string;
  mandatory: boolean;
  maxOccurrences: number;
  position: number;
  triggerSegment: string;
  children: (SegmentNode | SegmentGroupNode)[];
}

export type SegmentOrGroup = SegmentNode | SegmentGroupNode;

// ============================================================================
// MESSAGE LEVEL (Top Level - Composite Pattern Root)
// ============================================================================

export interface MessageStructure {
  standard: string;
  version: string;
  messageType: string;
  name: string;
  description?: string;
  structure: SegmentOrGroup[];
}


// ============================================================================
// VISITOR PATTERN (for traversal) - Future Enhancement
// ============================================================================

/*
export interface MessageStructureVisitor {
  visitElement(node: ElementNode): void;
  visitComposite(node: CompositeElementNode): void;
  visitSegment(node: SegmentNode): void;
  visitSegmentGroup(node: SegmentGroupNode): void;
}

export function traverseMessageStructure(
  structure: SegmentOrGroup[],
  visitor: MessageStructureVisitor
): void {
  for (const node of structure) {
    if (isSegmentNode(node)) {
      visitor.visitSegment(node);

      for (const element of node.elements) {
        if (isElementNode(element)) {
          visitor.visitElement(element);
        } else {
          visitor.visitComposite(element);
          for (const component of element.components) {
            visitor.visitElement(component);
          }
        }
      }
    } else if (isSegmentGroupNode(node)) {
      visitor.visitSegmentGroup(node);
      traverseMessageStructure(node.children, visitor);
    }
  }
}
*/

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
const ordersMessage: MessageStructure = {
  standard: Standard.EDIFACT,
  version: 'D.20B',
  messageType: 'ORDERS',
  name: 'Purchase order message',
  structure: [
    // Segment (leaf)
    {
      nodeType: 'segment',
      tag: 'UNH',
      name: 'Message header',
      mandatory: true,
      maxOccurrences: 1,
      position: 10,
      elements: [
        {
          nodeType: 'element',
          code: '0062',
          name: 'Message reference number',
          mandatory: true,
          position: 1,
          dataType: 'an',
          maxLength: 14
        },
        {
          nodeType: 'composite',
          code: 'S009',
          name: 'Message identifier',
          mandatory: true,
          position: 2,
          components: [
            {
              nodeType: 'element',
              code: '0065',
              name: 'Message type identifier',
              mandatory: true,
              position: 1,
              dataType: 'an',
              maxLength: 6
            },
            {
              nodeType: 'element',
              code: '0052',
              name: 'Message version number',
              mandatory: true,
              position: 2,
              dataType: 'an',
              maxLength: 3
            }
          ]
        }
      ]
    },

    // Segment Group (composite)
    {
      nodeType: 'segmentGroup',
      id: 'SG1',
      name: 'Segment Group 1 - Reference',
      mandatory: false,
      maxOccurrences: 9999,
      position: 90,
      triggerSegment: 'RFF',
      children: [
        {
          nodeType: 'segment',
          tag: 'RFF',
          name: 'Reference',
          mandatory: true,
          maxOccurrences: 1,
          position: 100,
          elements: [...]
        },
        {
          nodeType: 'segment',
          tag: 'DTM',
          name: 'Date/time/period',
          mandatory: false,
          maxOccurrences: 5,
          position: 110,
          elements: [...]
        }
      ]
    },

    // Nested Segment Group
    {
      nodeType: 'segmentGroup',
      id: 'SG2',
      name: 'Segment Group 2 - Name and address',
      mandatory: false,
      maxOccurrences: 99,
      position: 120,
      triggerSegment: 'NAD',
      children: [
        {
          nodeType: 'segment',
          tag: 'NAD',
          name: 'Name and address',
          mandatory: true,
          maxOccurrences: 1,
          position: 130,
          elements: [...]
        },

        // Nested group within SG2
        {
          nodeType: 'segmentGroup',
          id: 'SG3',
          name: 'Segment Group 3 - Reference',
          mandatory: false,
          maxOccurrences: 99,
          position: 160,
          triggerSegment: 'RFF',
          children: [
            {
              nodeType: 'segment',
              tag: 'RFF',
              name: 'Reference',
              mandatory: true,
              maxOccurrences: 1,
              position: 170,
              elements: [...]
            }
          ]
        }
      ]
    }
  ]
};

// Traverse structure
class ValidationVisitor implements MessageStructureVisitor {
  visitElement(node: ElementNode): void {
    console.log(`Element: ${node.code} - ${node.name}`);
  }

  visitComposite(node: CompositeElementNode): void {
    console.log(`Composite: ${node.code} - ${node.name}`);
  }

  visitSegment(node: SegmentNode): void {
    console.log(`Segment: ${node.tag} - ${node.name}`);
  }

  visitSegmentGroup(node: SegmentGroupNode): void {
    console.log(`Group: ${node.id} - ${node.name}`);
  }
}

traverseMessageStructure(ordersMessage.structure, new ValidationVisitor());
*/
