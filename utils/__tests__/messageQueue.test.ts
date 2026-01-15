import {
  getMessageQueue,
  queueMessage,
  removeFromQueue,
  updateQueuedMessage,
  processMessageQueue,
  getQueuedMessagesForConversation,
  clearFailedMessages,
  retryFailedMessages,
  hasQueuedMessages,
  QueuedMessage,
} from '../messageQueue';
import storage from '../storage';

jest.mock('../storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../database', () => ({
  saveMessage: jest.fn(),
}));

import { saveMessage } from '../database';

describe('messageQueue', () => {
  const mockConversationId = 'conv-123';

  const createMockQueuedMessage = (overrides: Partial<QueuedMessage> = {}): QueuedMessage => ({
    id: `queued_${Date.now()}_abc123`,
    conversationId: mockConversationId,
    role: 'user',
    content: 'Test message',
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getItem as jest.Mock).mockResolvedValue(null);
    (storage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getMessageQueue', () => {
    it('returns empty array when no queue exists', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getMessageQueue();

      expect(result).toEqual([]);
    });

    it('returns parsed queue from storage', async () => {
      const mockQueue = [createMockQueuedMessage()];
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockQueue));

      const result = await getMessageQueue();

      expect(result).toEqual(mockQueue);
    });

    it('returns empty array on storage error', async () => {
      (storage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await getMessageQueue();

      expect(result).toEqual([]);
    });
  });

  describe('queueMessage', () => {
    it('adds message to queue with pending status', async () => {
      const messageId = await queueMessage(mockConversationId, 'user', 'Hello');

      expect(messageId).toMatch(/^queued_/);
      expect(storage.setItem).toHaveBeenCalled();

      const setItemCall = (storage.setItem as jest.Mock).mock.calls[0];
      const savedQueue = JSON.parse(setItemCall[1]);
      expect(savedQueue).toHaveLength(1);
      expect(savedQueue[0].status).toBe('pending');
      expect(savedQueue[0].content).toBe('Hello');
    });

    it('appends to existing queue', async () => {
      const existingMessage = createMockQueuedMessage({ id: 'existing-123' });
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingMessage]));

      await queueMessage(mockConversationId, 'user', 'New message');

      const setItemCall = (storage.setItem as jest.Mock).mock.calls[0];
      const savedQueue = JSON.parse(setItemCall[1]);
      expect(savedQueue).toHaveLength(2);
    });
  });

  describe('removeFromQueue', () => {
    it('removes message by id', async () => {
      const message1 = createMockQueuedMessage({ id: 'msg-1' });
      const message2 = createMockQueuedMessage({ id: 'msg-2' });
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([message1, message2]));

      await removeFromQueue('msg-1');

      const setItemCall = (storage.setItem as jest.Mock).mock.calls[0];
      const savedQueue = JSON.parse(setItemCall[1]);
      expect(savedQueue).toHaveLength(1);
      expect(savedQueue[0].id).toBe('msg-2');
    });
  });

  describe('updateQueuedMessage', () => {
    it('updates message properties', async () => {
      const message = createMockQueuedMessage({ id: 'msg-1', status: 'pending' });
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([message]));

      await updateQueuedMessage('msg-1', { status: 'processing' });

      const setItemCall = (storage.setItem as jest.Mock).mock.calls[0];
      const savedQueue = JSON.parse(setItemCall[1]);
      expect(savedQueue[0].status).toBe('processing');
    });
  });

  describe('processMessageQueue', () => {
    it('processes pending messages', async () => {
      const message = createMockQueuedMessage({ id: 'msg-1', status: 'pending' });
      (storage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify([message]))
        .mockResolvedValueOnce(JSON.stringify([message]))
        .mockResolvedValueOnce(JSON.stringify([{ ...message, status: 'processing' }]))
        .mockResolvedValueOnce(JSON.stringify([{ ...message, status: 'processing' }]));
      (saveMessage as jest.Mock).mockResolvedValue({ id: 'saved-msg' });

      await processMessageQueue();

      expect(saveMessage).toHaveBeenCalledWith(
        mockConversationId,
        'user',
        'Test message'
      );
    });

    it('does nothing when queue is empty', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

      await processMessageQueue();

      expect(saveMessage).not.toHaveBeenCalled();
    });
  });

  describe('getQueuedMessagesForConversation', () => {
    it('filters messages by conversation id', async () => {
      const message1 = createMockQueuedMessage({ conversationId: 'conv-1' });
      const message2 = createMockQueuedMessage({ conversationId: 'conv-2' });
      const message3 = createMockQueuedMessage({ conversationId: 'conv-1' });
      (storage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([message1, message2, message3])
      );

      const result = await getQueuedMessagesForConversation('conv-1');

      expect(result).toHaveLength(2);
      expect(result.every(m => m.conversationId === 'conv-1')).toBe(true);
    });
  });

  describe('clearFailedMessages', () => {
    it('removes failed messages from queue', async () => {
      const pendingMessage = createMockQueuedMessage({ id: 'pending-1', status: 'pending' });
      const failedMessage = createMockQueuedMessage({ id: 'failed-1', status: 'failed' });
      (storage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([pendingMessage, failedMessage])
      );

      await clearFailedMessages();

      const setItemCall = (storage.setItem as jest.Mock).mock.calls[0];
      const savedQueue = JSON.parse(setItemCall[1]);
      expect(savedQueue).toHaveLength(1);
      expect(savedQueue[0].id).toBe('pending-1');
    });
  });

  describe('retryFailedMessages', () => {
    it('resets failed messages to pending status', async () => {
      const failedMessage = createMockQueuedMessage({
        id: 'failed-1',
        status: 'failed',
        retryCount: 3,
      });
      (storage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify([failedMessage]))
        .mockResolvedValueOnce(JSON.stringify([{ ...failedMessage, status: 'pending', retryCount: 0 }]));
      (saveMessage as jest.Mock).mockResolvedValue({ id: 'saved-msg' });

      await retryFailedMessages();

      const firstSetItemCall = (storage.setItem as jest.Mock).mock.calls[0];
      const savedQueue = JSON.parse(firstSetItemCall[1]);
      expect(savedQueue[0].status).toBe('pending');
      expect(savedQueue[0].retryCount).toBe(0);
    });
  });

  describe('hasQueuedMessages', () => {
    it('returns true when queue has messages', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([createMockQueuedMessage()])
      );

      const result = await hasQueuedMessages();

      expect(result).toBe(true);
    });

    it('returns false when queue is empty', async () => {
      (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

      const result = await hasQueuedMessages();

      expect(result).toBe(false);
    });
  });
});
