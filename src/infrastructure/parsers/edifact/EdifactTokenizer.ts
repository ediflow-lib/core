import { Delimiters } from '../../../domain';
import { ITokenizer } from '../../../application';

export class EdifactTokenizer implements ITokenizer {
  tokenize(message: string, delimiters: Delimiters): string[] {
    this.validateMessage(message);

    const segments: string[] = [];
    let currentSegment = '';
    let position = 0;

    while (position < message.length) {
      const char = message[position];
      if (!char) break;

      if (this.isEscapedCharacter(message, position, delimiters)) {
        currentSegment += this.consumeEscapedCharacter(message, position);
        position += 2;
        continue;
      }

      if (this.isSegmentTerminator(char, delimiters)) {
        this.addSegmentIfNotEmpty(segments, currentSegment);
        currentSegment = '';
        position++;
        continue;
      }

      currentSegment += char;
      position++;
    }

    this.addSegmentIfNotEmpty(segments, currentSegment);
    return segments;
  }

  private validateMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
  }

  private isEscapedCharacter(message: string, position: number, delimiters: Delimiters): boolean {
    return message[position] === delimiters.escape && position + 1 < message.length;
  }

  private consumeEscapedCharacter(message: string, position: number): string {
    const char1 = message[position];
    const char2 = message[position + 1];
    return (char1 ?? '') + (char2 ?? '');
  }

  private isSegmentTerminator(char: string, delimiters: Delimiters): boolean {
    return char === delimiters.segment;
  }

  private addSegmentIfNotEmpty(segments: string[], segment: string): void {
    if (segment.trim().length > 0) {
      segments.push(segment);
    }
  }
}
