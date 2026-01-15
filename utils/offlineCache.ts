import storage from './storage';
import { DBMessage, DBConversation } from './supabase';
import { createLogger } from './logger';

const logger = createLogger('offlineCache');

const CACHE_KEYS = {
  CONVERSATIONS: 'cached_conversations',
  MESSAGES_PREFIX: 'cached_messages_',
  LAST_SYNC: 'last_sync_time',
};

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function getCachedConversations(userId: string): Promise<DBConversation[]> {
  try {
    const key = `${CACHE_KEYS.CONVERSATIONS}_${userId}`;
    const cached = await storage.getItem(key);
    if (!cached) return [];

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > CACHE_EXPIRY_MS) {
      logger.debug('Cache expired for conversations', { userId, ageMs: age });
      await storage.removeItem(key);
      return [];
    }

    return data;
  } catch (error) {
    logger.error('Failed to read cached conversations', error, { userId });
    return [];
  }
}

export async function cacheConversations(userId: string, conversations: DBConversation[]): Promise<void> {
  try {
    const key = `${CACHE_KEYS.CONVERSATIONS}_${userId}`;
    const cacheData = {
      data: conversations,
      timestamp: Date.now(),
    };
    await storage.setItem(key, JSON.stringify(cacheData));
    logger.debug('Cached conversations', { userId, count: conversations.length });
  } catch (error) {
    logger.error('Failed to cache conversations', error, { userId });
  }
}

export async function getCachedMessages(conversationId: string): Promise<DBMessage[]> {
  try {
    const key = `${CACHE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    const cached = await storage.getItem(key);
    if (!cached) return [];

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > CACHE_EXPIRY_MS) {
      logger.debug('Cache expired for messages', { conversationId, ageMs: age });
      await storage.removeItem(key);
      return [];
    }

    return data;
  } catch (error) {
    logger.error('Failed to read cached messages', error, { conversationId });
    return [];
  }
}

export async function cacheMessages(conversationId: string, messages: DBMessage[]): Promise<void> {
  try {
    const key = `${CACHE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    const cacheData = {
      data: messages,
      timestamp: Date.now(),
    };
    await storage.setItem(key, JSON.stringify(cacheData));
    logger.debug('Cached messages', { conversationId, count: messages.length });
  } catch (error) {
    logger.error('Failed to cache messages', error, { conversationId });
  }
}

export async function addMessageToCache(conversationId: string, message: DBMessage): Promise<void> {
  try {
    const cachedMessages = await getCachedMessages(conversationId);
    const updatedMessages = [...cachedMessages, message];
    await cacheMessages(conversationId, updatedMessages);
  } catch (error) {
    logger.error('Failed to add message to cache', error, { conversationId, messageId: message.id });
  }
}

export async function updateConversationInCache(userId: string, conversationId: string, updates: Partial<DBConversation>): Promise<void> {
  try {
    const cachedConversations = await getCachedConversations(userId);
    const updatedConversations = cachedConversations.map(conv =>
      conv.id === conversationId ? { ...conv, ...updates } : conv
    );
    await cacheConversations(userId, updatedConversations);
    logger.debug('Updated conversation in cache', { userId, conversationId });
  } catch (error) {
    logger.error('Failed to update conversation in cache', error, { userId, conversationId });
  }
}

export async function removeConversationFromCache(userId: string, conversationId: string): Promise<void> {
  try {
    const cachedConversations = await getCachedConversations(userId);
    const updatedConversations = cachedConversations.filter(conv => conv.id !== conversationId);
    await cacheConversations(userId, updatedConversations);

    const messagesKey = `${CACHE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    await storage.removeItem(messagesKey);
    logger.debug('Removed conversation from cache', { userId, conversationId });
  } catch (error) {
    logger.error('Failed to remove conversation from cache', error, { userId, conversationId });
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const allKeys = await getAllCacheKeys();
    await Promise.all(allKeys.map(key => storage.removeItem(key)));
    logger.info('Cleared all cache');
  } catch (error) {
    logger.error('Failed to clear cache', error);
  }
}

async function getAllCacheKeys(): Promise<string[]> {
  return [];
}

export async function getLastSyncTime(): Promise<number | null> {
  try {
    const lastSync = await storage.getItem(CACHE_KEYS.LAST_SYNC);
    return lastSync ? parseInt(lastSync, 10) : null;
  } catch (error) {
    logger.error('Failed to read last sync time', error);
    return null;
  }
}

export async function setLastSyncTime(timestamp: number): Promise<void> {
  try {
    await storage.setItem(CACHE_KEYS.LAST_SYNC, timestamp.toString());
    logger.debug('Set last sync time', { timestamp });
  } catch (error) {
    logger.error('Failed to set last sync time', error);
  }
}
