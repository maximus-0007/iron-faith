import {
  getMessageFeedback,
  setMessageFeedback,
  removeMessageFeedback,
  getConversationFeedback,
  FeedbackType,
} from '../feedback';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('feedback utilities', () => {
  const mockMessageId = 'msg-123';
  const mockUserId = 'user-456';
  const mockConversationId = 'conv-789';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessageFeedback', () => {
    it('returns feedback type when feedback exists', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: { feedback_type: 'positive' },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValueOnce({ eq: mockEq });
      mockEq.mockReturnValueOnce({ maybeSingle: mockMaybeSingle });

      const result = await getMessageFeedback(mockMessageId, mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('message_feedback');
      expect(result).toBe('positive');
    });

    it('returns null when no feedback exists', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await getMessageFeedback(mockMessageId, mockUserId);

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);
      console.error = jest.fn();

      const result = await getMessageFeedback(mockMessageId, mockUserId);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('setMessageFeedback', () => {
    it('returns true on successful upsert', async () => {
      const mockChain = {
        upsert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await setMessageFeedback(mockMessageId, mockUserId, 'positive');

      expect(supabase.from).toHaveBeenCalledWith('message_feedback');
      expect(mockChain.upsert).toHaveBeenCalledWith(
        {
          message_id: mockMessageId,
          user_id: mockUserId,
          feedback_type: 'positive',
        },
        {
          onConflict: 'message_id,user_id',
        }
      );
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      const mockChain = {
        upsert: jest.fn().mockResolvedValue({
          error: new Error('Upsert failed'),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);
      console.error = jest.fn();

      const result = await setMessageFeedback(mockMessageId, mockUserId, 'negative');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('removeMessageFeedback', () => {
    it('returns true on successful delete', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockChain.eq.mockImplementation(() => {
        return {
          eq: jest.fn().mockResolvedValue({ error: null }),
        };
      });

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await removeMessageFeedback(mockMessageId, mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('message_feedback');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockChain.eq.mockImplementation(() => {
        return {
          eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
        };
      });

      (supabase.from as jest.Mock).mockReturnValue(mockChain);
      console.error = jest.fn();

      const result = await removeMessageFeedback(mockMessageId, mockUserId);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getConversationFeedback', () => {
    it('returns map of feedback for conversation', async () => {
      const mockData = [
        { message_id: 'msg-1', feedback_type: 'positive' },
        { message_id: 'msg-2', feedback_type: 'negative' },
        { message_id: 'msg-3', feedback_type: 'positive' },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await getConversationFeedback(mockConversationId, mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('message_feedback');
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(3);
      expect(result.get('msg-1')).toBe('positive');
      expect(result.get('msg-2')).toBe('negative');
      expect(result.get('msg-3')).toBe('positive');
    });

    it('returns empty map when no feedback exists', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await getConversationFeedback(mockConversationId, mockUserId);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('returns empty map on error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Query failed'),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);
      console.error = jest.fn();

      const result = await getConversationFeedback(mockConversationId, mockUserId);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
