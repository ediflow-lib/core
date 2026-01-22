import { describe, it, expect } from 'vitest';
import { EdifactDelimiterDetector } from './EdifactDelimiterDetector';

describe('EdifactDelimiterDetector', () => {
  const detector = new EdifactDelimiterDetector();

  describe('hasUNA', () => {
    it('should detect UNA segment with standard delimiters', () => {
      const message = "UNA:+.? 'UNH+1+DESADV:D:20B:UN'";

      expect(detector.hasUNA(message)).toBe(true);
    });

    it('should detect UNA segment with custom delimiters', () => {
      const message = 'UNA;|.!~UNH|1|DESADV;D;20B;UN~';

      expect(detector.hasUNA(message)).toBe(true);
    });

    it('should return false when no UNA segment', () => {
      const message = "UNH+1+DESADV:D:20B:UN'";

      expect(detector.hasUNA(message)).toBe(false);
    });

    it('should return false when message too short', () => {
      const message = 'UNA:+';

      expect(detector.hasUNA(message)).toBe(false);
    });

    it('should return false when starts with UNH', () => {
      const message = "UNH+1+DESADV:D:20B:UN'";

      expect(detector.hasUNA(message)).toBe(false);
    });
  });

  describe('extractFromUNA', () => {
    it('should extract standard EDIFACT delimiters from UNA', () => {
      const message = "UNA:+.? 'UNH+1+DESADV:D:20B:UN'";

      const delimiters = detector.extractFromUNA(message);

      expect(delimiters.component).toBe(':');
      expect(delimiters.element).toBe('+');
      expect(delimiters.decimal).toBe('.');
      expect(delimiters.escape).toBe('?');
      expect(delimiters.segment).toBe("'");
    });

    it('should extract custom delimiters from UNA', () => {
      const message = 'UNA;|.! ~UNH|1|DESADV;D;20B;UN~';

      const delimiters = detector.extractFromUNA(message);

      expect(delimiters.component).toBe(';');
      expect(delimiters.element).toBe('|');
      expect(delimiters.decimal).toBe('.');
      expect(delimiters.escape).toBe('!');
      expect(delimiters.segment).toBe('~');
    });

    it('should extract custom delimiters variant 2', () => {
      const message = 'UNA:*.! ~UNH*1*DESADV:D:20B:UN~';

      const delimiters = detector.extractFromUNA(message);

      expect(delimiters.component).toBe(':');
      expect(delimiters.element).toBe('*');
      expect(delimiters.decimal).toBe('.');
      expect(delimiters.escape).toBe('!');
      expect(delimiters.segment).toBe('~');
    });

    it('should throw error when message does not start with UNA', () => {
      const message = "UNH+1+DESADV:D:20B:UN'";

      expect(() => detector.extractFromUNA(message)).toThrow('Message does not start with valid UNA segment');
    });

    it('should throw error when UNA is incomplete', () => {
      const message = 'UNA:+';

      expect(() => detector.extractFromUNA(message)).toThrow('Message does not start with valid UNA segment');
    });
  });

  describe('detect', () => {
    it('should detect and extract from UNA when present', () => {
      const message = "UNA:+.? 'UNH+1+DESADV:D:20B:UN'";

      const delimiters = detector.detect(message);

      expect(delimiters.component).toBe(':');
      expect(delimiters.element).toBe('+');
      expect(delimiters.segment).toBe("'");
    });

    it('should use standard defaults when no UNA', () => {
      const message = "UNH+1+DESADV:D:20B:UN'";

      const delimiters = detector.detect(message);

      expect(delimiters.component).toBe(':');
      expect(delimiters.element).toBe('+');
      expect(delimiters.segment).toBe("'");
    });

    it('should detect custom delimiters from UNA', () => {
      const message = 'UNA;|.! ~UNH|1|DESADV;D;20B;UN~';

      const delimiters = detector.detect(message);

      expect(delimiters.component).toBe(';');
      expect(delimiters.element).toBe('|');
      expect(delimiters.segment).toBe('~');
    });
  });

  describe('getMessageWithoutUNA', () => {
    it('should remove UNA segment from message', () => {
      const message = "UNA:+.? 'UNH+1+DESADV:D:20B:UN'BGM+351+DOC123+9'";

      const result = detector.getMessageWithoutUNA(message);

      expect(result).toBe("UNH+1+DESADV:D:20B:UN'BGM+351+DOC123+9'");
    });

    it('should return original message when no UNA', () => {
      const message = "UNH+1+DESADV:D:20B:UN'BGM+351+DOC123+9'";

      const result = detector.getMessageWithoutUNA(message);

      expect(result).toBe(message);
    });

    it('should handle UNA with custom delimiters', () => {
      const message = 'UNA;|.! ~UNH|1|DESADV;D;20B;UN~BGM|351|DOC123|9~';

      const result = detector.getMessageWithoutUNA(message);

      expect(result).toBe('UNH|1|DESADV;D;20B;UN~BGM|351|DOC123|9~');
    });
  });

  describe('getMessageWithoutFormatSpecificHeader', () => {
    it('should remove UNA segment from message', () => {
      const message = "UNA:+.? 'UNH+1+DESADV:D:20B:UN'BGM+351+DOC123+9'";

      const result = detector.getMessageWithoutFormatSpecificHeader(message);

      expect(result).toBe("UNH+1+DESADV:D:20B:UN'BGM+351+DOC123+9'");
    });

    it('should return original message when no UNA', () => {
      const message = "UNH+1+DESADV:D:20B:UN'BGM+351+DOC123+9'";

      const result = detector.getMessageWithoutFormatSpecificHeader(message);

      expect(result).toBe(message);
    });

    it('should handle UNA with custom delimiters', () => {
      const message = 'UNA;|.! ~UNH|1|DESADV;D;20B;UN~BGM|351|DOC123|9~';

      const result = detector.getMessageWithoutFormatSpecificHeader(message);

      expect(result).toBe('UNH|1|DESADV;D;20B;UN~BGM|351|DOC123|9~');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle EDIFACT with UNB envelope', () => {
      const message = "UNA:+.? 'UNB+UNOC:3+SENDER:14+RECEIVER:14+260121:1200+12345'UNH+1+DESADV:D:20B:UN'";

      const delimiters = detector.detect(message);

      expect(delimiters.component).toBe(':');
      expect(delimiters.element).toBe('+');
      expect(delimiters.segment).toBe("'");
    });

    it('should handle EDIFACT without UNB (point-to-point)', () => {
      const message = "UNA:+.? 'UNH+1+DESADV:D:20B:UN'BGM+351+DOC123+9'";

      const delimiters = detector.detect(message);

      expect(delimiters.component).toBe(':');
      expect(delimiters.element).toBe('+');
      expect(delimiters.segment).toBe("'");
    });

    it('should handle EDIFACT without UNA and UNB', () => {
      const message = "UNH+1+DESADV:D:20B:UN'BGM+351+DOC123+9'DTM+137:20260121:102'";

      const delimiters = detector.detect(message);

      expect(delimiters.component).toBe(':');
      expect(delimiters.element).toBe('+');
      expect(delimiters.segment).toBe("'");
    });

    it('should handle custom delimiter variant from UK partner', () => {
      const message = 'UNA;|.! ~UNH|1|ORDERS;D;96A;UN~BGM|220|ORDER123~';

      const delimiters = detector.detect(message);

      expect(delimiters.component).toBe(';');
      expect(delimiters.element).toBe('|');
      expect(delimiters.escape).toBe('!');
      expect(delimiters.segment).toBe('~');
    });
  });
});
