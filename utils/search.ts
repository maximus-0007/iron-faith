import { supabase } from './supabase';

export interface SearchResult {
  id: string;
  type: 'conversation' | 'message';
  conversationId: string;
  title?: string;
  content: string;
  timestamp: string;
  highlight?: string;
}

export interface ConversationSearchResult {
  id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
}

/**
 * Search across all conversations by title
 */
export async function searchConversations(
  userId: string,
  query: string
): Promise<ConversationSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  // Prepare the search query for PostgreSQL full-text search
  const searchQuery = query
    .trim()
    .split(/\s+/)
    .map(term => `${term}:*`)
    .join(' & ');

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      title,
      last_message_at,
      messages (count)
    `)
    .eq('user_id', userId)
    .textSearch('search_vector', searchQuery)
    .order('last_message_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error searching conversations:', error);
    return [];
  }

  return (data || []).map(conv => ({
    id: conv.id,
    title: conv.title,
    lastMessageAt: conv.last_message_at,
    messageCount: Array.isArray(conv.messages) ? conv.messages.length : 0,
  }));
}

/**
 * Search within messages of a specific conversation
 */
export async function searchConversationMessages(
  conversationId: string,
  query: string
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  // Prepare the search query
  const searchQuery = query
    .trim()
    .split(/\s+/)
    .map(term => `${term}:*`)
    .join(' & ');

  const { data, error } = await supabase
    .from('messages')
    .select('id, content, role, created_at')
    .eq('conversation_id', conversationId)
    .textSearch('search_vector', searchQuery)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error searching messages:', error);
    return [];
  }

  return (data || []).map(msg => ({
    id: msg.id,
    type: 'message' as const,
    conversationId,
    content: msg.content,
    timestamp: msg.created_at,
    highlight: extractHighlight(msg.content, query),
  }));
}

/**
 * Search across all conversations and messages
 */
export async function searchAll(
  userId: string,
  query: string
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  // Prepare the search query
  const searchQuery = query
    .trim()
    .split(/\s+/)
    .map(term => `${term}:*`)
    .join(' & ');

  // Search messages
  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      role,
      created_at,
      conversation_id,
      conversations!inner (
        user_id,
        title
      )
    `)
    .eq('conversations.user_id', userId)
    .textSearch('search_vector', searchQuery)
    .order('created_at', { ascending: false })
    .limit(50);

  if (messageError) {
    console.error('Error searching messages:', messageError);
    return [];
  }

  const results: SearchResult[] = (messageData || []).map(msg => ({
    id: msg.id,
    type: 'message' as const,
    conversationId: msg.conversation_id,
    title: (msg.conversations as any)?.title,
    content: msg.content,
    timestamp: msg.created_at,
    highlight: extractHighlight(msg.content, query),
  }));

  return results;
}

/**
 * Extract a snippet of text around the search query match
 */
function extractHighlight(content: string, query: string, contextLength: number = 100): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/);

  // Find the first occurrence of any search term
  let matchIndex = -1;
  for (const term of terms) {
    matchIndex = lowerContent.indexOf(term);
    if (matchIndex !== -1) break;
  }

  if (matchIndex === -1) {
    // No match found, return beginning of content
    return content.substring(0, contextLength * 2) + (content.length > contextLength * 2 ? '...' : '');
  }

  // Extract context around the match
  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(content.length, matchIndex + contextLength);

  let snippet = content.substring(start, end);

  // Add ellipsis if we're not at the start/end
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(
  userId: string,
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!query.trim()) {
    return [];
  }

  const searchQuery = query
    .trim()
    .split(/\s+/)
    .map(term => `${term}:*`)
    .join(' & ');

  const { data, error } = await supabase
    .from('conversations')
    .select('title')
    .eq('user_id', userId)
    .textSearch('search_vector', searchQuery)
    .limit(limit);

  if (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }

  return (data || []).map(conv => conv.title).filter(Boolean);
}

/**
 * Simple client-side search for conversations (fallback)
 */
export function simpleSearchConversations(
  conversations: any[],
  query: string
): any[] {
  if (!query.trim()) {
    return conversations;
  }

  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/);

  return conversations.filter(conv => {
    const title = (conv.title || '').toLowerCase();
    return terms.some(term => title.includes(term));
  });
}
