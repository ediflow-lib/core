import { describe, it, expect } from 'vitest';
import { EdifactTokenizer } from './EdifactTokenizer';
import { Delimiters } from '@ediflow/core';

describe('EdifactTokenizer', () => {
  const tokenizer = new EdifactTokenizer();

  const standardDelimiters = Delimiters.custom({
    component: ':',
    element: '+',
    decimal: '.',
    escape: '?',
    segment: "'",
  });

  describe('tokenize', () => {
    it('should split message into segments using segment terminator', () => {
      const message = "UNB+UNOC:3+SENDER+RECEIVER+20260122:1200+12345'UNH+1+ORDERS:D:96A:UN'UNT+2+1'UNZ+1+12345'";

      const segments = tokenizer.tokenize(message, standardDelimiters);

      expect(segments).toHaveLength(4);
      expect(segments[0]).toBe('UNB+UNOC:3+SENDER+RECEIVER+20260122:1200+12345');
      expect(segments[1]).toBe('UNH+1+ORDERS:D:96A:UN');
      expect(segments[2]).toBe('UNT+2+1');
      expect(segments[3]).toBe('UNZ+1+12345');
    });

    it('should handle empty segments', () => {
      const message = "UNB+SENDER'UNH+1''UNT+1'";

      const segments = tokenizer.tokenize(message, standardDelimiters);

      expect(segments).toHaveLength(3);
      expect(segments[0]).toBe('UNB+SENDER');
      expect(segments[1]).toBe('UNH+1');
      expect(segments[2]).toBe('UNT+1');
    });

    it('should ignore escaped segment terminators', () => {
      const message = "UNB+TEXT:?'DATA+RECEIVER'UNH+1+ORDERS'";

      const segments = tokenizer.tokenize(message, standardDelimiters);

      expect(segments).toHaveLength(2);
      expect(segments[0]).toBe("UNB+TEXT:?'DATA+RECEIVER");
      expect(segments[1]).toBe('UNH+1+ORDERS');
    });

    it('should handle message with custom delimiters', () => {
      const customDelimiters = Delimiters.custom({
        component: ';',
        element: '|',
        decimal: '.',
        escape: '!',
        segment: '~',
      });

      const message = 'UNB|SENDER|RECEIVER~UNH|1|ORDERS~UNT|2|1~';

      const segments = tokenizer.tokenize(message, customDelimiters);

      expect(segments).toHaveLength(3);
      expect(segments[0]).toBe('UNB|SENDER|RECEIVER');
      expect(segments[1]).toBe('UNH|1|ORDERS');
      expect(segments[2]).toBe('UNT|2|1');
    });

    it('should handle escaped escape character', () => {
      const message = "UNB+TEXT:??DATA+RECEIVER'UNH+1'";

      const segments = tokenizer.tokenize(message, standardDelimiters);

      expect(segments).toHaveLength(2);
      expect(segments[0]).toBe('UNB+TEXT:??DATA+RECEIVER');
      expect(segments[1]).toBe('UNH+1');
    });

    it('should handle message ending with segment terminator', () => {
      const message = "UNB+SENDER'UNH+1'";

      const segments = tokenizer.tokenize(message, standardDelimiters);

      expect(segments).toHaveLength(2);
    });

    it('should filter out empty segments', () => {
      const message = "UNB+SENDER''UNH+1'";

      const segments = tokenizer.tokenize(message, standardDelimiters);

      expect(segments).toHaveLength(2);
      expect(segments[0]).toBe('UNB+SENDER');
      expect(segments[1]).toBe('UNH+1');
    });

    it('should throw error for empty message', () => {
      expect(() => tokenizer.tokenize('', standardDelimiters)).toThrow('Message cannot be empty');
    });

    it('should handle message with no segments', () => {
      const message = 'NOSEGMENTS';

      const segments = tokenizer.tokenize(message, standardDelimiters);

      expect(segments).toHaveLength(1);
      expect(segments[0]).toBe('NOSEGMENTS');
    });
  });
});
