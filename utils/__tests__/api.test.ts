import { sendChatMessage } from '../api';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

describe('API Utils', () => {
  const mockSession = {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: 'user-123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  });

  describe('sendChatMessage', () => {
    it('sends a message successfully without streaming', async () => {
      const mockResponse = {
        answer: 'This is a test response',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        body: null,
      });

      const result = await sendChatMessage('Test question');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/bibleChat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Test question'),
        })
      );
    });

    it('includes conversation history when provided', async () => {
      const mockResponse = {
        answer: 'Response with history',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        body: null,
      });

      const conversationHistory = [
        { role: 'user' as const, content: 'Previous question' },
        { role: 'assistant' as const, content: 'Previous answer' },
      ];

      await sendChatMessage('New question', conversationHistory);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.conversationHistory).toEqual(conversationHistory);
    });

    it('includes user preferences when provided', async () => {
      const mockResponse = {
        answer: 'Response',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        body: null,
      });

      const settings = {
        responseLength: 'concise' as const,
        includeScriptureReferences: true,
        askClarifyingQuestions: true,
        colorScheme: 'dark' as const,
        name: 'John',
        about: 'Test user',
      };

      await sendChatMessage('Question', [], settings);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.preferences).toEqual({
        responseLength: 'concise',
        includeScriptureReferences: true,
        askClarifyingQuestions: true,
      });
      expect(requestBody.userProfile).toEqual({
        name: 'John',
        about: 'Test user',
      });
    });

    it('includes intake profile when provided', async () => {
      const mockResponse = {
        answer: 'Response',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        body: null,
      });

      const intakeProfile = {
        relationship_status: 'married',
        has_children: true,
        career_stage: 'established',
        spiritual_struggles: ['pornography', 'anger'],
      };

      await sendChatMessage('Question', [], undefined, undefined, intakeProfile);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.intakeProfile).toEqual(intakeProfile);
    });

    it('handles streaming responses with chunks', async () => {
      const chunks = ['Hello ', 'world', '!'];
      let chunkIndex = 0;

      const mockReader = {
        read: jest.fn().mockImplementation(async () => {
          if (chunkIndex < chunks.length) {
            const chunk = `data: ${JSON.stringify({ content: chunks[chunkIndex] })}\n\n`;
            chunkIndex++;
            return {
              done: false,
              value: new TextEncoder().encode(chunk),
            };
          }
          return { done: true };
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const receivedChunks: string[] = [];
      const onChunk = (chunk: string) => receivedChunks.push(chunk);

      const result = await sendChatMessage('Question', [], undefined, onChunk);

      expect(receivedChunks).toEqual(chunks);
      expect(result.answer).toBe('Hello world!');
    });

    it('throws error when no session exists', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await expect(sendChatMessage('Question')).rejects.toThrow(
        'Your session has expired. Please sign in again.'
      );
    });

    it('throws error when Supabase URL is missing', async () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;

      await expect(sendChatMessage('Question')).rejects.toThrow(
        'Supabase configuration missing'
      );
    }, 10000);

    it('handles API error responses', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' }),
        });

      await expect(sendChatMessage('Question')).rejects.toThrow(
        'Our servers are experiencing issues. Please try again in a moment.'
      );
    }, 10000);

    it('handles rate limit errors (429)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'MESSAGE_LIMIT_REACHED',
          message: 'Rate limit exceeded',
        }),
      });

      try {
        await sendChatMessage('Question');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(429);
        expect(error.code).toBe('MESSAGE_LIMIT_REACHED');
      }
    });

    it('retries on network errors', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            answer: 'Success after retry',
            timestamp: '2024-01-01T00:00:00.000Z',
          }),
          body: null,
        });

      const promise = sendChatMessage('Question');

      await jest.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(result.answer).toBe('Success after retry');
      expect(global.fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('does not retry on 4xx client errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
      });

      await expect(sendChatMessage('Question')).rejects.toThrow('Unable to send your message. Please try again.');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('handles malformed streaming data gracefully', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('invalid json\n\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"content": "valid"}\n\n'),
          })
          .mockResolvedValueOnce({ done: true }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const receivedChunks: string[] = [];
      const result = await sendChatMessage(
        'Question',
        [],
        undefined,
        (chunk) => receivedChunks.push(chunk)
      );

      expect(receivedChunks).toEqual(['valid']);
      expect(result.answer).toBe('valid');
    });
  });
});
