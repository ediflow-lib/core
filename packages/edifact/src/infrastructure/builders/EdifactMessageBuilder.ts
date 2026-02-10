import {
    EDIMessage, EDISegment, EDIElement, Standard, Delimiters,
    IMessageBuilder,
    MessageBuilderOptions,
    OutputFormat
} from '@ediflow/core';
import { EdifactDelimiters } from './EdifactDelimiters';

export interface EdifactBuilderOptions extends MessageBuilderOptions {
    includeUNA?: boolean;
}

export class EdifactMessageBuilder implements IMessageBuilder {
    private static readonly DEFAULT_DELIMITERS: EdifactDelimiters = EdifactDelimiters.default();

    build(message: EDIMessage, options?: EdifactBuilderOptions): string {
        const delimiters = this.resolveDelimiters(options?.delimiters);
        const format = options?.format || OutputFormat.COMPACT;

        let result = '';

        if (options?.includeUNA) {
            result += delimiters.toUNA();
        }

        result += this.buildSegments(message, delimiters, format);

        return result;
    }

    private resolveDelimiters(delimiters?: Delimiters): EdifactDelimiters {
        if (!delimiters) {
            return EdifactMessageBuilder.DEFAULT_DELIMITERS;
        }

        if (delimiters instanceof EdifactDelimiters) {
            return delimiters;
        }

        return this.toEdifactDelimiters(delimiters);
    }

    private toEdifactDelimiters(delimiters: Delimiters): EdifactDelimiters {
        return EdifactDelimiters.custom({
            component: delimiters.component,
            element: delimiters.element,
            decimal: delimiters.decimal,
            escape: delimiters.escape,
            segment: delimiters.segment,
            repetition: delimiters.repetition,
        });
    }
    getSupportedStandard(): Standard {
        return Standard.EDIFACT;
    }

    private buildSegments(message: EDIMessage, delimiters: Delimiters, format: OutputFormat): string {
        const segmentStrings = message.segments.map(seg =>
            this.serializeSegment(seg, delimiters)
        );

        if (format === OutputFormat.READABLE) {
            return this.joinReadable(segmentStrings, delimiters.segment);
        }

        return this.joinCompact(segmentStrings, delimiters.segment);
    }

    private joinReadable(segments: string[], delimiter: string): string {
        return segments.join(delimiter + '\n') + delimiter + '\n';
    }

    private joinCompact(segments: string[], delimiter: string): string {
        return segments.join(delimiter) + delimiter;
    }

    private serializeSegment(segment: EDISegment, delimiters: Delimiters): string {
        const elements = [
            segment.tag,
            ...segment.elements.map(el => this.serializeElement(el, delimiters))
        ];

        return elements.join(delimiters.element);
    }

    private serializeElement(element: EDIElement, delimiters: Delimiters): string {
        return element.isComposite()
            ? element.components.join(delimiters.component)
            : element.value;
    }
}
