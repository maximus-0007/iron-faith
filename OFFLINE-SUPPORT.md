# Offline Support

This document describes the offline functionality implemented in Iron Faith.

## Features

### 1. Local Caching
- All conversations and messages are automatically cached locally using AsyncStorage (mobile) or localStorage (web)
- Cache expires after 24 hours
- Cached data is used when offline or when network requests fail

### 2. Network Status Detection
- Automatic network status monitoring
- Real-time detection of online/offline status changes
- Visual banner notification when connection is lost or restored

### 3. Message Queue
- Messages sent while offline are automatically queued
- Queue persists across app restarts (stored in AsyncStorage/localStorage)
- Queue is processed automatically when connection is restored
- Queue is processed automatically on app startup (if user is authenticated and online)
- Failed messages are retried up to 3 times
- Maximum retry limit prevents infinite loops
- Visual "Syncing messages..." banner shows when queue is being processed

### 4. Graceful Degradation
- All read operations return cached data when offline
- Write operations are queued for later sync
- UI remains fully functional with cached data

## Architecture

### Core Files

#### `utils/offlineCache.ts`
Handles local caching of conversations and messages:
- `getCachedConversations(userId)` - Retrieve cached conversations
- `cacheConversations(userId, conversations)` - Store conversations locally
- `getCachedMessages(conversationId)` - Retrieve cached messages
- `cacheMessages(conversationId, messages)` - Store messages locally
- `addMessageToCache(conversationId, message)` - Add single message to cache
- `updateConversationInCache(userId, conversationId, updates)` - Update conversation in cache
- `removeConversationFromCache(userId, conversationId)` - Remove conversation from cache
- `clearAllCache()` - Clear all cached data

#### `utils/messageQueue.ts`
Manages queued messages for offline sync:
- `queueMessage(conversationId, role, content)` - Add message to queue
- `processMessageQueue()` - Process all pending messages
- `getQueuedMessagesForConversation(conversationId)` - Get queued messages for a conversation
- `removeFromQueue(messageId)` - Remove message from queue
- `retryFailedMessages()` - Retry all failed messages
- `clearFailedMessages()` - Remove failed messages from queue

#### `utils/networkStatus.ts`
Network monitoring and status management:
- `useNetworkStatus()` - React hook for network status
- `getIsOnline()` - Get current online status
- `checkNetworkConnection()` - Manually check network connection
- `initializeNetworkMonitoring()` - Start automatic network monitoring

#### `utils/database.ts`
Updated with offline-first approach:
- All read operations check cache first, then network
- Write operations queue messages when offline
- Automatic cache updates on successful operations

## Usage

### Network Status in Components

```typescript
import { useNetworkStatus } from '@/utils/networkStatus';

function MyComponent() {
  const { isOnline, isOffline } = useNetworkStatus();

  return (
    <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
  );
}
```

### Manual Queue Processing

```typescript
import { processMessageQueue, retryFailedMessages } from '@/utils/messageQueue';

// Process pending messages
await processMessageQueue();

// Retry failed messages
await retryFailedMessages();
```

### Cache Management

```typescript
import { getCachedConversations, clearAllCache } from '@/utils/offlineCache';

// Get cached conversations
const conversations = await getCachedConversations(userId);

// Clear all cached data
await clearAllCache();
```

## Behavior

### Online
1. Fetch data from Supabase
2. Update local cache with fresh data
3. Return fresh data to UI
4. Process any queued messages

### Offline
1. Return cached data immediately
2. Queue write operations
3. Show offline banner
4. All UI remains functional with cached data

### Reconnection
1. Show "Back online" banner
2. Automatically detect and process message queue
3. Show "Syncing messages..." banner while processing
4. Sync queued messages with server
5. Update cache with fresh data
6. Refresh conversations and messages in UI

### App Restart (with queued messages)
1. User opens app and authenticates
2. Check for queued messages in storage
3. If messages exist and device is online, show "Syncing messages..." banner
4. Process all queued messages
5. Update UI with synced conversations and messages

## Cache Expiry

- Conversations: 24 hours
- Messages: 24 hours
- After expiry, cache is cleared and fresh data is fetched on next online connection

## Error Handling

### Network Errors
- Automatic fallback to cached data
- Failed operations are queued for retry
- User sees cached data without interruption

### Queue Failures
- Messages retry up to 3 times with exponential backoff
- After 3 failures, messages are marked as "failed"
- Failed messages can be manually retried
- Users can clear failed messages

## Testing Offline Mode

### Web (Chrome/Edge)
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. App will use cached data and queue messages

### Mobile (Expo Go)
1. Enable Airplane mode on device
2. App will automatically detect offline status
3. Messages will be queued and synced when online

### Programmatic Testing
```typescript
import { setIsOnline } from '@/utils/networkStatus';

// Simulate offline
setIsOnline(false);

// Simulate online
setIsOnline(true);
```

## Limitations

1. User profile and translation preferences are not cached (always require online)
2. New conversation creation requires online connection
3. Message queue is stored locally and will be lost only if app data/localStorage is manually cleared
4. Cache expires after 24 hours
5. No conflict resolution for concurrent edits

## Future Enhancements

- [ ] Conflict resolution for concurrent edits
- [ ] Selective cache invalidation
- [ ] Cache size limits and LRU eviction
- [ ] Background sync with service workers (web)
- [ ] Offline conversation creation
- [ ] Differential sync to reduce bandwidth
- [ ] Cache analytics and monitoring
