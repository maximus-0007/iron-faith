# Error Recovery System

This document describes the comprehensive error recovery system implemented in Iron Faith.

## Features

### 1. Global Error Boundary
- Context-aware error messages based on error type
- Actionable recovery suggestions
- Automatic error categorization
- User-friendly error presentation

### 2. Error Categorization
- Network errors
- Authentication errors
- Rate limit errors
- Server errors
- Validation errors
- Unknown errors

### 3. Message Retry System
- Visual status indicators for failed messages
- One-click retry for failed messages
- Retry progress feedback
- Automatic cleanup after successful retry

### 4. Edge Function Error Handling
- Automatic retry with exponential backoff
- Detailed error messages for different failure types
- Rate limit detection and handling
- Network failure detection

## Architecture

### Core Files

#### `utils/errorHandler.ts`
Central error handling utility:
- `ErrorType` enum - Categorizes different error types
- `AppError` interface - Structured error format
- `categorizeError(error)` - Categorizes any error into AppError
- `getErrorRecoveryActions(errorType)` - Returns helpful recovery steps
- `shouldShowRetryButton(error)` - Determines if retry is appropriate
- `formatErrorForDisplay(error)` - User-friendly error message

#### `components/ErrorBoundary.tsx`
Enhanced React error boundary:
- Catches all React component errors
- Shows context-appropriate error screens
- Provides recovery actions based on error type
- Different icons and colors for different error types
- Scrollable content for long error messages

#### `components/MessageRetryButton.tsx`
Retry UI component for failed messages:
- Shows "Failed to send" badge
- Retry button with loading state
- Animated feedback during retry
- Disabled state while retrying

#### `components/ChatBubble.tsx`
Enhanced with status tracking:
- `MessageStatus` type for tracking message state
- Shows retry button for failed messages
- Visual feedback for different message states
- Integrates with retry system

#### `screens/ChatScreen.tsx`
Updated with retry logic:
- Tracks failed message status
- Handles message retry attempts
- Updates UI based on retry state
- Categorizes and displays errors appropriately

## Error Types

### Network Errors
**Symptoms:**
- "Failed to fetch"
- "Network request failed"
- Connection timeout

**User Message:**
> Unable to connect. Please check your internet connection and try again.

**Recovery Actions:**
1. Check your internet connection
2. Try again in a few moments
3. Switch to a different network if available

**Retryable:** Yes

### Authentication Errors
**Symptoms:**
- "No active session"
- "Not authenticated"
- 401 status codes

**User Message:**
> Your session has expired. Please log in again.

**Recovery Actions:**
1. Log out and log back in
2. Clear your browser cache
3. Contact support if the issue persists

**Retryable:** No (requires login)

### Rate Limit Errors
**Symptoms:**
- MESSAGE_LIMIT_REACHED code
- 429 status code

**User Message:**
> You have reached your message limit. Please upgrade to continue.

**Recovery Actions:**
1. Upgrade to Premium for unlimited messages
2. Wait until your daily limit resets
3. Review your subscription status

**Retryable:** No (requires upgrade)

### Server Errors
**Symptoms:**
- 500-599 status codes
- Internal server errors

**User Message:**
> Our servers are experiencing issues. Please try again in a moment.

**Recovery Actions:**
1. Wait a few moments and try again
2. Check our status page for updates
3. Contact support if the issue continues

**Retryable:** Yes

### Validation Errors
**Symptoms:**
- 400-499 status codes (except 401, 429)
- Bad request errors

**User Message:**
> There was a problem with your request. Please try again.

**Recovery Actions:**
1. Review your input and try again
2. Make sure all required fields are filled
3. Contact support if you need help

**Retryable:** No (requires user correction)

## Usage

### Categorizing Errors

```typescript
import { categorizeError } from '@/utils/errorHandler';

try {
  await somethingRisky();
} catch (error) {
  const appError = categorizeError(error);
  console.log('Error type:', appError.type);
  console.log('User message:', appError.userMessage);
  console.log('Can retry:', appError.isRetryable);
}
```

### Getting Recovery Actions

```typescript
import { getErrorRecoveryActions, ErrorType } from '@/utils/errorHandler';

const actions = getErrorRecoveryActions(ErrorType.NETWORK);
actions.forEach(action => console.log('-', action));
```

### Message Status Tracking

```typescript
import { Message, MessageStatus } from '@/components/ChatBubble';

const message: Message = {
  id: '123',
  type: 'user',
  content: 'Hello',
  timestamp: new Date().toISOString(),
  status: 'sent',
};

if (messageFailed) {
  message.status = 'failed';
  message.error = 'Network error occurred';
}
```

### Implementing Retry

```typescript
const handleRetryMessage = async (messageId: string) => {
  const failedMessage = messages.find(m => m.id === messageId);
  if (!failedMessage) return;

  setRetrying(messageId);

  try {
    await resendMessage(failedMessage);
    setMessages(prev =>
      prev.map(m => m.id === messageId
        ? { ...m, status: 'sent' }
        : m
      )
    );
  } catch (error) {
    const appError = categorizeError(error);
    setMessages(prev =>
      prev.map(m => m.id === messageId
        ? { ...m, status: 'failed', error: appError.userMessage }
        : m
      )
    );
  } finally {
    setRetrying(null);
  }
};
```

## Error Flow

### 1. Error Occurs
```
User sends message → API call fails → Error thrown
```

### 2. Error Categorization
```
catch block → categorizeError() → AppError object
```

### 3. User Notification
```
AppError → UI update → User sees error message
```

### 4. Recovery Options
```
Error type → Recovery actions → User sees suggestions
```

### 5. Retry (if applicable)
```
User clicks retry → Retry handler → Original action re-executed
```

## Message Status States

### `sent`
- Message successfully delivered
- Default state for successful messages
- No visual indicator needed

### `sending`
- Message currently being sent
- Could show loading indicator
- Not currently used (uses isLoading instead)

### `failed`
- Message failed to send
- Shows error badge and retry button
- Stores error message for display

### `queued`
- Message queued for offline sync
- Part of offline support system
- Will retry when connection restored

## API Error Handling

The API layer (`utils/api.ts`) includes built-in retry logic:

1. **Automatic Retry:**
   - Max 3 retries
   - Exponential backoff (1s, 2s, 4s)
   - Skips retry for rate limits and client errors

2. **Error Detection:**
   - 429 status → Rate limit
   - 4xx status → Client error (no retry)
   - 5xx status → Server error (retry)
   - Network failure → Retry

3. **Streaming Support:**
   - Handles streaming response errors
   - Cleans up readers on failure
   - Preserves partial content where possible

## Error Boundary Behavior

### Component Errors
Catches React component rendering errors:
```typescript
class ErrorBoundary {
  componentDidCatch(error, errorInfo) {
    // Log error
    // Show fallback UI
    // Provide recovery option
  }
}
```

### Different Error Screens
- Network errors → Connection icon
- Auth errors → Lock icon
- Rate limits → Warning icon (orange)
- Other errors → Alert icon

### Reset Behavior
- Retry button resets error state
- Component tree re-renders
- Previous state restored if possible

## Testing Error Recovery

### Simulate Network Error
```typescript
// In development, override fetch
const originalFetch = window.fetch;
window.fetch = () => Promise.reject(new Error('Network request failed'));

// Send message → should show network error with retry
```

### Simulate Rate Limit
```typescript
// Send many messages quickly
// Should hit rate limit and show upgrade modal
```

### Simulate Server Error
```typescript
// Mock API response with 500 status
// Should show server error with retry option
```

### Test Retry Flow
```typescript
// 1. Cause message to fail
// 2. Click retry button
// 3. Verify retry state shows
// 4. Verify success or new error
```

## Best Practices

### For Developers

1. **Always Categorize Errors:**
   ```typescript
   catch (error) {
     const appError = categorizeError(error);
     // Use appError, not raw error
   }
   ```

2. **Provide Context:**
   ```typescript
   throw new Error('Failed to load messages: ' + context);
   ```

3. **Don't Over-Retry:**
   ```typescript
   if (retryCount >= MAX_RETRIES) {
     throw error; // Let user decide
   }
   ```

4. **Log Errors:**
   ```typescript
   console.error('Detailed error:', error);
   console.log('User sees:', appError.userMessage);
   ```

### For Users

1. **Network Errors:**
   - Check WiFi/data connection
   - Try toggling airplane mode
   - Reload the app

2. **Server Errors:**
   - Wait a few minutes
   - Try again
   - Check app status page

3. **Auth Errors:**
   - Log out and back in
   - Clear app cache
   - Reinstall if persistent

4. **Rate Limits:**
   - Consider upgrading
   - Wait for reset
   - Review usage

## Future Enhancements

- [ ] Error analytics tracking
- [ ] Automatic error reporting
- [ ] Smart retry delays based on error type
- [ ] Batch retry for multiple failed messages
- [ ] Error history and debugging tools
- [ ] Offline error queue persistence
- [ ] Custom error recovery flows per error type
- [ ] A/B testing for error messages
- [ ] Error recovery success metrics
