import {
  parseScriptureReferences,
  isValidReference,
  formatVerseText,
  getAvailableTranslations,
  canAccessTranslation,
} from '../bible';

describe('Bible Utils', () => {
  describe('parseScriptureReferences', () => {
    it('parses single verse reference', () => {
      const text = 'Read John 3:16 for guidance';
      const references = parseScriptureReferences(text);
      expect(references.length).toBeGreaterThan(0);
      expect(references.some(ref => ref.includes('John 3:16'))).toBe(true);
    });

    it('parses multiple verse references', () => {
      const text = 'Check Genesis 1:1 and Revelation 22:21';
      const references = parseScriptureReferences(text);
      expect(references.length).toBeGreaterThanOrEqual(2);
      expect(references.some(ref => ref.includes('Genesis 1:1'))).toBe(true);
      expect(references.some(ref => ref.includes('Revelation 22:21'))).toBe(true);
    });

    it('parses verse ranges', () => {
      const text = 'Read Psalm 23:1-6';
      const references = parseScriptureReferences(text);
      expect(references.some(ref => ref.includes('Psalm 23'))).toBe(true);
    });

    it('handles abbreviated book names', () => {
      const text = 'See 1 Cor 13:4-7';
      const references = parseScriptureReferences(text);
      expect(references.length).toBeGreaterThan(0);
    });

    it('returns empty array for text without references', () => {
      const text = 'This is just regular text without any Bible references';
      const references = parseScriptureReferences(text);
      expect(references).toEqual([]);
    });
  });

  describe('isValidReference', () => {
    it('validates correct reference format', () => {
      expect(isValidReference('John 3:16')).toBe(true);
      expect(isValidReference('Genesis 1:1')).toBe(true);
      expect(isValidReference('Psalm 23:1-6')).toBe(true);
    });

    it('rejects invalid reference format', () => {
      expect(isValidReference('Invalid Reference')).toBe(false);
      expect(isValidReference('123:456')).toBe(false);
      expect(isValidReference('')).toBe(false);
    });
  });

  describe('formatVerseText', () => {
    it('formats verse with book, chapter, and verse', () => {
      const verse = {
        reference: 'John 3:16',
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        translation: 'KJV',
      };
      const formatted = formatVerseText(verse);
      expect(formatted).toContain('John 3:16');
      expect(formatted).toContain('For God so loved the world...');
    });

    it('includes translation abbreviation', () => {
      const verse = {
        reference: 'John 3:16',
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        translation: 'NIV',
      };
      const formatted = formatVerseText(verse);
      expect(formatted).toContain('NIV');
    });
  });

  describe('getAvailableTranslations', () => {
    it('returns more translations for premium users', () => {
      const freeTranslations = getAvailableTranslations(false, false);
      const premiumTranslations = getAvailableTranslations(true, false);
      expect(premiumTranslations.length).toBeGreaterThan(freeTranslations.length);
    });

    it('returns all translations for trial users', () => {
      const freeTranslations = getAvailableTranslations(false, false);
      const trialTranslations = getAvailableTranslations(false, true);
      expect(trialTranslations.length).toBeGreaterThan(freeTranslations.length);
    });

    it('includes basic translations for free users', () => {
      const translations = getAvailableTranslations(false, false);
      const ids = translations.map(t => t.id);
      expect(ids).toContain('de4e12af7f28f599-02');
    });
  });

  describe('canAccessTranslation', () => {
    it('allows free translations for all users', () => {
      expect(canAccessTranslation('de4e12af7f28f599-02', false, false)).toBe(true);
      expect(canAccessTranslation('de4e12af7f28f599-02', true, false)).toBe(true);
      expect(canAccessTranslation('de4e12af7f28f599-02', false, true)).toBe(true);
    });

    it('restricts premium translations to premium users', () => {
      expect(canAccessTranslation('63097d2a0a2f7db3-01', false, false)).toBe(false);
      expect(canAccessTranslation('63097d2a0a2f7db3-01', true, false)).toBe(true);
    });

    it('allows premium translations for trial users', () => {
      expect(canAccessTranslation('63097d2a0a2f7db3-01', false, true)).toBe(true);
      expect(canAccessTranslation('b8ee27bcd1cae43a-01', false, true)).toBe(true);
    });
  });
});
