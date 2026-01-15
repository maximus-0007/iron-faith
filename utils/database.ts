import { supabase, DBMessage, DBConversation, DBUserProfile } from './supabase';
import { getCachedConversations, cacheConversations, getCachedMessages, cacheMessages, addMessageToCache, removeConversationFromCache } from './offlineCache';
import { queueMessage, processMessageQueue } from './messageQueue';
import { getIsOnline } from './networkStatus';
import { createLogger } from './logger';
import { assertValidUserId, assertValidConversationId, assertNonEmptyString } from './validation';

const logger = createLogger('database');

export async function createConversation(userId: string): Promise<string> {
  assertValidUserId(userId);

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: 'New Conversation'
    })
    .select('id')
    .single();

  if (error) throw error;

  const conversations = await getCachedConversations(userId);
  const newConversation: DBConversation = {
    id: data.id,
    user_id: userId,
    title: 'New Conversation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await cacheConversations(userId, [newConversation, ...conversations]);
  logger.debug('Created conversation', { userId, conversationId: data.id });

  return data.id;
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<DBMessage> {
  assertValidConversationId(conversationId);
  assertNonEmptyString(content, 'Message content');

  const isOnline = getIsOnline();

  if (!isOnline) {
    const queuedId = await queueMessage(conversationId, role, content);
    const tempMessage: DBMessage = {
      id: queuedId,
      conversation_id: conversationId,
      role,
      content,
      created_at: new Date().toISOString(),
    };
    await addMessageToCache(conversationId, tempMessage);
    logger.debug('Message queued (offline)', { conversationId, messageId: queuedId });
    return tempMessage;
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content
      })
      .select()
      .single();

    if (error) throw error;

    await addMessageToCache(conversationId, data);
    return data;
  } catch (error) {
    logger.warn('Failed to save message online, queuing for retry', error, { conversationId });
    const queuedId = await queueMessage(conversationId, role, content);
    const tempMessage: DBMessage = {
      id: queuedId,
      conversation_id: conversationId,
      role,
      content,
      created_at: new Date().toISOString(),
    };
    await addMessageToCache(conversationId, tempMessage);
    return tempMessage;
  }
}

export async function getConversationMessages(
  conversationId: string
): Promise<DBMessage[]> {
  assertValidConversationId(conversationId);

  const cachedMessages = await getCachedMessages(conversationId);

  const isOnline = getIsOnline();
  if (!isOnline) {
    logger.debug('Returning cached messages (offline)', { conversationId, count: cachedMessages.length });
    return cachedMessages;
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const messages = data || [];
    await cacheMessages(conversationId, messages);
    return messages;
  } catch (error) {
    logger.warn('Failed to fetch messages, returning cached', error, { conversationId });
    return cachedMessages;
  }
}

export async function getUserConversations(
  userId: string,
  limit?: number,
  offset?: number
): Promise<DBConversation[]> {
  assertValidUserId(userId);

  const cachedConversations = await getCachedConversations(userId);

  const isOnline = getIsOnline();
  if (!isOnline) {
    logger.debug('Returning cached conversations (offline)', { userId, count: cachedConversations.length });
    return cachedConversations;
  }

  try {
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (limit !== undefined) {
      query = query.limit(limit);
    }

    if (offset !== undefined) {
      query = query.range(offset, offset + (limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    const conversations = data || [];

    if (!limit && !offset) {
      await cacheConversations(userId, conversations);
      await processMessageQueue();
    }

    return conversations;
  } catch (error) {
    logger.warn('Failed to fetch conversations, returning cached', error, { userId });
    return cachedConversations;
  }
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  assertValidConversationId(conversationId);
  assertNonEmptyString(title, 'Title');

  try {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) throw error;
    logger.debug('Updated conversation title', { conversationId, title });
  } catch (error) {
    logger.error('Failed to update conversation title', error, { conversationId });
  }
}

export async function toggleConversationPin(
  conversationId: string,
  userId: string
): Promise<boolean> {
  assertValidConversationId(conversationId);
  assertValidUserId(userId);

  try {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('pinned')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    const newPinnedState = !conversation?.pinned;
    const pinnedAt = newPinnedState ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('conversations')
      .update({
        pinned: newPinnedState,
        pinned_at: pinnedAt
      })
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;

    logger.debug('Toggled conversation pin', { conversationId, pinned: newPinnedState });
    return newPinnedState;
  } catch (error) {
    logger.error('Failed to toggle conversation pin', error, { conversationId });
    throw error;
  }
}

export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  assertValidConversationId(conversationId);

  await removeConversationFromCache(userId, conversationId);

  const isOnline = getIsOnline();
  if (!isOnline) {
    logger.debug('Conversation removed from cache only (offline)', { conversationId });
    return;
  }

  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
    logger.debug('Deleted conversation', { conversationId });
  } catch (error) {
    logger.error('Failed to delete conversation from server', error, { conversationId });
  }
}

export function generateConversationTitle(
  firstMessage: string
): string {
  const trimmed = firstMessage.trim();

  if (trimmed === '') {
    return 'New Conversation';
  }

  const sentenceEnd = trimmed.indexOf('?');
  if (sentenceEnd !== -1) {
    return trimmed.substring(0, sentenceEnd + 1);
  }

  const words = trimmed.split(' ');
  const title = words.slice(0, 6).join(' ');
  return title.length < trimmed.length ? `${title}...` : title;
}

export async function getUserProfile(userId: string): Promise<DBUserProfile | null> {
  assertValidUserId(userId);

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createUserProfile(
  userId: string,
  name: string,
  about: string
): Promise<DBUserProfile> {
  assertValidUserId(userId);

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      name,
      about
    })
    .select()
    .single();

  if (error) throw error;
  logger.debug('Created user profile', { userId });
  return data;
}

export async function updateUserProfile(
  userId: string,
  name: string,
  about: string
): Promise<DBUserProfile> {
  assertValidUserId(userId);

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      name,
      about
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  logger.debug('Updated user profile', { userId });
  return data;
}

export async function saveUserProfile(
  userId: string,
  name: string,
  about: string
): Promise<DBUserProfile> {
  const existing = await getUserProfile(userId);

  if (existing) {
    return updateUserProfile(userId, name, about);
  } else {
    return createUserProfile(userId, name, about);
  }
}

export interface UserTranslationPreference {
  id: string;
  user_id: string;
  translation_id: string;
  translation_name: string;
  translation_abbreviation: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getUserTranslationPreferences(
  userId: string
): Promise<UserTranslationPreference[]> {
  assertValidUserId(userId);

  const { data, error } = await supabase
    .from('user_translation_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addUserTranslation(
  userId: string,
  translationId: string,
  translationName: string,
  translationAbbreviation: string
): Promise<void> {
  assertValidUserId(userId);

  const { data: existingPrefs } = await supabase
    .from('user_translation_preferences')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = existingPrefs && existingPrefs.length > 0 ? existingPrefs[0].sort_order + 1 : 0;

  const { error } = await supabase
    .from('user_translation_preferences')
    .insert({
      user_id: userId,
      translation_id: translationId,
      translation_name: translationName,
      translation_abbreviation: translationAbbreviation,
      is_enabled: true,
      sort_order: nextSortOrder
    });

  if (error) throw error;
  logger.debug('Added user translation', { userId, translationId });
}

export async function removeUserTranslation(
  userId: string,
  translationId: string
): Promise<void> {
  assertValidUserId(userId);

  const { error } = await supabase
    .from('user_translation_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('translation_id', translationId);

  if (error) throw error;
  logger.debug('Removed user translation', { userId, translationId });
}

export async function updateTranslationOrder(
  userId: string,
  translationId: string,
  newSortOrder: number
): Promise<void> {
  assertValidUserId(userId);

  const { error } = await supabase
    .from('user_translation_preferences')
    .update({ sort_order: newSortOrder })
    .eq('user_id', userId)
    .eq('translation_id', translationId);

  if (error) throw error;
  logger.debug('Updated translation order', { userId, translationId, newSortOrder });
}

export interface CachedVerse {
  id: string;
  user_id: string;
  verse_reference: string;
  translation_id: string;
  verse_text: string;
  book_name: string;
  chapter: number;
  verse_number: number;
  verse_end?: number;
  cached_at: string;
  expires_at: string;
  created_at: string;
}

export async function getCachedVerse(
  userId: string,
  verseReference: string,
  translationId: string
): Promise<CachedVerse | null> {
  assertValidUserId(userId);
  assertNonEmptyString(verseReference, 'Verse reference');
  assertNonEmptyString(translationId, 'Translation ID');

  try {
    const { data, error } = await supabase
      .from('verse_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('verse_reference', verseReference)
      .eq('translation_id', translationId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;

    if (data) {
      logger.debug('Cache hit for verse', { verseReference, translationId });
    }

    return data;
  } catch (error) {
    logger.warn('Failed to get cached verse', error, { verseReference, translationId });
    return null;
  }
}

export async function getCachedVersesMultiple(
  userId: string,
  verseReference: string,
  translationIds: string[]
): Promise<CachedVerse[]> {
  assertValidUserId(userId);
  assertNonEmptyString(verseReference, 'Verse reference');

  if (translationIds.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('verse_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('verse_reference', verseReference)
      .in('translation_id', translationIds)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    logger.debug('Cache lookup for multiple translations', {
      verseReference,
      requested: translationIds.length,
      found: data?.length || 0
    });

    return data || [];
  } catch (error) {
    logger.warn('Failed to get cached verses', error, { verseReference });
    return [];
  }
}

export async function saveCachedVerse(
  userId: string,
  verseReference: string,
  translationId: string,
  verseText: string,
  bookName: string,
  chapter: number,
  verseNumber: number,
  verseEnd?: number
): Promise<void> {
  assertValidUserId(userId);
  assertNonEmptyString(verseReference, 'Verse reference');
  assertNonEmptyString(translationId, 'Translation ID');
  assertNonEmptyString(verseText, 'Verse text');
  assertNonEmptyString(bookName, 'Book name');

  try {
    const cachedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('verse_cache')
      .upsert({
        user_id: userId,
        verse_reference: verseReference,
        translation_id: translationId,
        verse_text: verseText,
        book_name: bookName,
        chapter,
        verse_number: verseNumber,
        verse_end: verseEnd,
        cached_at: cachedAt,
        expires_at: expiresAt
      }, {
        onConflict: 'user_id,verse_reference,translation_id'
      });

    if (error) throw error;

    logger.debug('Saved verse to cache', { verseReference, translationId });
  } catch (error) {
    logger.warn('Failed to save verse to cache', error, { verseReference, translationId });
  }
}

export async function cleanupExpiredVerseCache(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_verse_cache');

    if (error) throw error;

    const deletedCount = data || 0;
    logger.debug('Cleaned up expired verse cache', { deletedCount });
    return deletedCount;
  } catch (error) {
    logger.warn('Failed to cleanup expired verse cache', error);
    return 0;
  }
}
