import { generateConversationTitle } from '../database';

describe('Database Utils', () => {
  describe('generateConversationTitle', () => {
    it('generates title from short question', () => {
      const title = generateConversationTitle('How do I pray?');
      expect(title).toBe('How do I pray?');
    });

    it('truncates long questions', () => {
      const longQuestion = 'This is a very long question that should be truncated to fit within the maximum character limit';
      const title = generateConversationTitle(longQuestion);
      expect(title.length).toBeLessThanOrEqual(53);
      expect(title).toContain('...');
    });

    it('handles questions with multiple sentences', () => {
      const question = 'How do I grow in faith? What should I do daily?';
      const title = generateConversationTitle(question);
      expect(title).toBe('How do I grow in faith?');
    });

    it('preserves question marks', () => {
      const question = 'What is salvation?';
      const title = generateConversationTitle(question);
      expect(title).toBe('What is salvation?');
    });

    it('handles empty string', () => {
      const title = generateConversationTitle('');
      expect(title).toBe('New Conversation');
    });

    it('handles whitespace-only string', () => {
      const title = generateConversationTitle('   ');
      expect(title).toBe('New Conversation');
    });
  });
});
