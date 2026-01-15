import storage from './storage';
import { saveMessage } from './database';
import { createLogger } from './logger';

const logger = createLogger('messageQueue');

const QUEUE_KEY = 'message_queue';

export interface QueuedMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

export interface QueuedChatMessage {
  id: string;
  conversationId: string;
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

const MAX_RETRIES = 3;

export async function getMessageQueue(): Promise<QueuedMessage[]> {
  try {
    const queue = await storage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    logger.error('Failed to read message queue', error);
    return [];
  }
}

async function saveMessageQueue(queue: QueuedMessage[]): Promise<void> {
  try {
    await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    logger.error('Failed to save message queue', error);
  }
}

export async function queueMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<string> {
  const queue = await getMessageQueue();
  const messageId = `queued_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const queuedMessage: QueuedMessage = {
    id: messageId,
    conversationId,
    role,
    content,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  queue.push(queuedMessage);
  await saveMessageQueue(queue);
  logger.info('Message queued for later sync', { messageId, conversationId });

  return messageId;
}

export async function removeFromQueue(messageId: string): Promise<void> {
  const queue = await getMessageQueue();
  const updatedQueue = queue.filter(msg => msg.id !== messageId);
  await saveMessageQueue(updatedQueue);
  logger.debug('Removed message from queue', { messageId });
}

export async function updateQueuedMessage(messageId: string, updates: Partial<QueuedMessage>): Promise<void> {
  const queue = await getMessageQueue();
  const updatedQueue = queue.map(msg =>
    msg.id === messageId ? { ...msg, ...updates } : msg
  );
  await saveMessageQueue(updatedQueue);
}

export async function processMessageQueue(): Promise<void> {
  const queue = await getMessageQueue();
  const pendingMessages = queue.filter(msg => msg.status === 'pending');

  if (pendingMessages.length === 0) {
    return;
  }

  logger.info('Processing message queue', { pendingCount: pendingMessages.length });

  for (const message of pendingMessages) {
    try {
      await updateQueuedMessage(message.id, { status: 'processing' });

      await saveMessage(message.conversationId, message.role, message.content);

      await removeFromQueue(message.id);
      logger.debug('Successfully synced queued message', { messageId: message.id });
    } catch (error) {
      const newRetryCount = message.retryCount + 1;
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      if (newRetryCount >= MAX_RETRIES) {
        await updateQueuedMessage(message.id, {
          status: 'failed',
          retryCount: newRetryCount,
          error: errorMessage,
        });
        logger.warn('Message permanently failed after max retries', {
          messageId: message.id,
          retryCount: newRetryCount,
          error: errorMessage,
        });
      } else {
        await updateQueuedMessage(message.id, {
          status: 'pending',
          retryCount: newRetryCount,
        });
        logger.debug('Message retry scheduled', {
          messageId: message.id,
          retryCount: newRetryCount,
        });
      }
    }
  }
}

export async function getQueuedMessagesForConversation(conversationId: string): Promise<QueuedMessage[]> {
  const queue = await getMessageQueue();
  return queue.filter(msg => msg.conversationId === conversationId);
}

export async function clearFailedMessages(): Promise<void> {
  const queue = await getMessageQueue();
  const activeQueue = queue.filter(msg => msg.status !== 'failed');
  const removedCount = queue.length - activeQueue.length;
  await saveMessageQueue(activeQueue);
  logger.info('Cleared failed messages from queue', { removedCount });
}

export async function retryFailedMessages(): Promise<void> {
  const queue = await getMessageQueue();
  const failedCount = queue.filter(msg => msg.status === 'failed').length;
  const updatedQueue = queue.map(msg =>
    msg.status === 'failed' ? { ...msg, status: 'pending' as const, retryCount: 0 } : msg
  );
  await saveMessageQueue(updatedQueue);
  logger.info('Retrying failed messages', { count: failedCount });
  await processMessageQueue();
}

export async function hasQueuedMessages(): Promise<boolean> {
  const queue = await getMessageQueue();
  return queue.length > 0;
}
