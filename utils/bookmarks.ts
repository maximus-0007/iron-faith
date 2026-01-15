import { supabase } from './supabase';

export interface MessageBookmark {
  id: string;
  user_id: string;
  conversation_id: string;
  message_id: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FolderItem {
  id: string;
  folder_id: string;
  conversation_id: string;
  added_at: string;
}

/**
 * Get all bookmarks for the current user
 */
export async function getBookmarks(userId: string): Promise<MessageBookmark[]> {
  const { data, error } = await supabase
    .from('message_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookmarks:', error);
    return [];
  }

  return data || [];
}

/**
 * Get bookmarks for a specific conversation
 */
export async function getConversationBookmarks(
  userId: string,
  conversationId: string
): Promise<MessageBookmark[]> {
  const { data, error } = await supabase
    .from('message_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversation bookmarks:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if a message is bookmarked
 */
export async function isMessageBookmarked(
  userId: string,
  messageId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('message_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('message_id', messageId)
    .maybeSingle();

  if (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }

  return !!data;
}

/**
 * Add a bookmark
 */
export async function addBookmark(
  userId: string,
  conversationId: string,
  messageId: string,
  note?: string
): Promise<MessageBookmark | null> {
  const { data, error } = await supabase
    .from('message_bookmarks')
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      message_id: messageId,
      note,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding bookmark:', error);
    return null;
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_bookmark_created_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (profile && !profile.first_bookmark_created_at) {
    await supabase
      .from('user_profiles')
      .update({ first_bookmark_created_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  return data;
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(
  userId: string,
  messageId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('message_bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('message_id', messageId);

  if (error) {
    console.error('Error removing bookmark:', error);
    return false;
  }

  return true;
}

/**
 * Update bookmark note
 */
export async function updateBookmarkNote(
  bookmarkId: string,
  note: string
): Promise<boolean> {
  const { error } = await supabase
    .from('message_bookmarks')
    .update({ note })
    .eq('id', bookmarkId);

  if (error) {
    console.error('Error updating bookmark note:', error);
    return false;
  }

  return true;
}

/**
 * Get all folders for the current user
 */
export async function getFolders(userId: string): Promise<ConversationFolder[]> {
  const { data, error } = await supabase
    .from('conversation_folders')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching folders:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new folder
 */
export async function createFolder(
  userId: string,
  name: string,
  color?: string,
  icon?: string
): Promise<ConversationFolder | null> {
  const { data: folders } = await supabase
    .from('conversation_folders')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = folders && folders.length > 0 ? folders[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('conversation_folders')
    .insert({
      user_id: userId,
      name,
      color: color || '#1E2D3D',
      icon: icon || 'folder',
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating folder:', error);
    return null;
  }

  return data;
}

/**
 * Update a folder
 */
export async function updateFolder(
  folderId: string,
  updates: Partial<Pick<ConversationFolder, 'name' | 'color' | 'icon' | 'sort_order'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('conversation_folders')
    .update(updates)
    .eq('id', folderId);

  if (error) {
    console.error('Error updating folder:', error);
    return false;
  }

  return true;
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: string): Promise<boolean> {
  const { error } = await supabase
    .from('conversation_folders')
    .delete()
    .eq('id', folderId);

  if (error) {
    console.error('Error deleting folder:', error);
    return false;
  }

  return true;
}

/**
 * Add a conversation to a folder
 */
export async function addConversationToFolder(
  folderId: string,
  conversationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('conversation_folder_items')
    .insert({
      folder_id: folderId,
      conversation_id: conversationId,
    });

  if (error) {
    console.error('Error adding conversation to folder:', error);
    return false;
  }

  return true;
}

/**
 * Remove a conversation from a folder
 */
export async function removeConversationFromFolder(
  folderId: string,
  conversationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('conversation_folder_items')
    .delete()
    .eq('folder_id', folderId)
    .eq('conversation_id', conversationId);

  if (error) {
    console.error('Error removing conversation from folder:', error);
    return false;
  }

  return true;
}

/**
 * Get all conversations in a folder
 */
export async function getFolderConversations(
  folderId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('conversation_folder_items')
    .select('conversation_id')
    .eq('folder_id', folderId);

  if (error) {
    console.error('Error fetching folder conversations:', error);
    return [];
  }

  return data?.map(item => item.conversation_id) || [];
}

/**
 * Get folders containing a specific conversation
 */
export async function getConversationFolders(
  conversationId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('conversation_folder_items')
    .select('folder_id')
    .eq('conversation_id', conversationId);

  if (error) {
    console.error('Error fetching conversation folders:', error);
    return [];
  }

  return data?.map(item => item.folder_id) || [];
}
