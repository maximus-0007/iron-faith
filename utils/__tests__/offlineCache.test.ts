import {
  getCachedConversations,
  cacheConversations,
  getCachedMessages,
  cacheMessages,
  addMessageToCache,
  updateConversationInCache,
  removeConversationFromCache,
  clearAllCache,
  getLastSyncTime,
  setLastSyncTime,
} from '../offlineCache';
import storage from '../storage';
import { DBConversation, DBMessage } from '../supabase';

jest.mock('../storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('offlineCache', () => {
  const mockUserId = 'user-123';
  const mockConversationId = 'conv-456';

  const mockConversation: DBConversation = {
    id: mockConversationId,
    user_id: mockUserId,
    title: 'Test Conversation',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  const mockMessage: DBMessage = {
    id: 'msg-789',
    conversation_id: mockConversationId,
    role: 'user',
    content: 'Hello',
    created_at: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCachedConversations', () => {
    it('returns empty array when no cache exists', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getCachedConversations(mockUserId);

      expect(result).toEqual([]);
    });

    it('returns cached conversations when valid', async () => {
      const cacheData = {
        data: [mockConversation],
        timestamp: Date.now(),
      };
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData));

      const result = await getCachedConversations(mockUserId);

      expect(result).toEqual([mockConversation]);
    });

    it('returns empty array and removes cache when expired', async () => {
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      const cacheData = {
        data: [mockConversation],
        timestamp: expiredTimestamp,
      };
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData));

      const result = await getCachedConversations(mockUserId);

      expect(result).toEqual([]);
      expect(storage.removeItem).toHaveBeenCalled();
    });

    it('returns empty array on storage error', async () => {
      (storage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await getCachedConversations(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('cacheConversations', () => {
    it('stores conversations with timestamp', async () => {
      (storage.setItem as jest.Mock).mockResolvedValue(undefined);

      await cacheConversations(mockUserId, [mockConversation]);

      expect(storage.setItem).toHaveBeenCalledWith(
        expect.stringContaining(mockUserId),
        expect.stringContaining(mockConversation.id)
      );
    });

    it('handles storage errors gracefully', async () => {
      (storage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(cacheConversations(mockUserId, [mockConversation])).resolves.not.toThrow();
    });
  });

  describe('getCachedMessages', () => {
    it('returns empty array when no cache exists', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getCachedMessages(mockConversationId);

      expect(result).toEqual([]);
    });

    it('returns cached messages when valid', async () => {
      const cacheData = {
        data: [mockMessage],
        timestamp: Date.now(),
      };
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData));

      const result = await getCachedMessages(mockConversationId);

      expect(result).toEqual([mockMessage]);
    });

    it('returns empty array when cache is expired', async () => {
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      const cacheData = {
        data: [mockMessage],
        timestamp: expiredTimestamp,
      };
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData));

      const result = await getCachedMessages(mockConversationId);

      expect(result).toEqual([]);
    });
  });

  describe('cacheMessages', () => {
    it('stores messages with timestamp', async () => {
      (storage.setItem as jest.Mock).mockResolvedValue(undefined);

      await cacheMessages(mockConversationId, [mockMessage]);

      expect(storage.setItem).toHaveBeenCalledWith(
        expect.stringContaining(mockConversationId),
        expect.stringContaining(mockMessage.id)
      );
    });
  });

  describe('addMessageToCache', () => {
    it('appends message to existing cache', async () => {
      const existingCache = {
        data: [mockMessage],
        timestamp: Date.now(),
      };
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingCache));
      (storage.setItem as jest.Mock).mockResolvedValue(undefined);

      const newMessage: DBMessage = {
        id: 'msg-new',
        conversation_id: mockConversationId,
        role: 'assistant',
        content: 'Response',
        created_at: '2024-01-01T00:01:00.000Z',
      };

      await addMessageToCache(mockConversationId, newMessage);

      const setItemCall = (storage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      expect(savedData.data).toHaveLength(2);
      expect(savedData.data[1].id).toBe('msg-new');
    });
  });

  describe('updateConversationInCache', () => {
    it('updates specific conversation in cache', async () => {
      const existingCache = {
        data: [mockConversation],
        timestamp: Date.now(),
      };
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingCache));
      (storage.setItem as jest.Mock).mockResolvedValue(undefined);

      await updateConversationInCache(mockUserId, mockConversationId, { title: 'Updated Title' });

      const setItemCall = (storage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      expect(savedData.data[0].title).toBe('Updated Title');
    });
  });

  describe('removeConversationFromCache', () => {
    it('removes conversation and its messages from cache', async () => {
      const existingCache = {
        data: [mockConversation],
        timestamp: Date.now(),
      };
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingCache));
      (storage.setItem as jest.Mock).mockResolvedValue(undefined);
      (storage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await removeConversationFromCache(mockUserId, mockConversationId);

      expect(storage.removeItem).toHaveBeenCalledWith(
        expect.stringContaining(mockConversationId)
      );
    });
  });

  describe('getLastSyncTime', () => {
    it('returns null when no sync time stored', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getLastSyncTime();

      expect(result).toBeNull();
    });

    it('returns stored sync time', async () => {
      const timestamp = Date.now();
      (storage.getItem as jest.Mock).mockResolvedValue(timestamp.toString());

      const result = await getLastSyncTime();

      expect(result).toBe(timestamp);
    });
  });

  describe('setLastSyncTime', () => {
    it('stores sync time', async () => {
      (storage.setItem as jest.Mock).mockResolvedValue(undefined);
      const timestamp = Date.now();

      await setLastSyncTime(timestamp);

      expect(storage.setItem).toHaveBeenCalledWith(
        'last_sync_time',
        timestamp.toString()
      );
    });
  });
});
