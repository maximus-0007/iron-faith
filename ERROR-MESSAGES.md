# Error Message Improvements

This document outlines the improvements made to error messages throughout Iron Faith to make them more user-friendly and actionable.

## Philosophy

All error messages follow these principles:

1. **User-Friendly Language**: Avoid technical jargon
2. **Clear and Specific**: Tell users exactly what went wrong
3. **Actionable**: Provide guidance on how to fix the issue
4. **Consistent**: Use similar language patterns across the app
5. **Respectful**: Never blame the user

## Error Message Categories

### 1. Connection Errors

#### Before
- "Supabase configuration missing"
- "Failed to fetch"
- "Network request failed"

#### After
- "Unable to connect. Please try again later."
- "Unable to connect. Please check your internet connection and try again."
- "Unable to process your request"

**Impact**: Users understand the issue is with connectivity, not their actions.

---

### 2. Authentication Errors

#### Sign In

**Before**
- "Invalid login credentials"
- "Email not confirmed"
- "Too many requests"

**After**
- "Incorrect email or password. Please try again."
- "Please verify your email address before signing in."
- "Too many sign in attempts. Please wait a moment and try again."

#### Sign Up

**Before**
- "User already registered"
- "Password should be at least 6 characters"
- "Invalid email"

**After**
- "An account with this email already exists. Please sign in instead."
- "Password must be at least 6 characters long."
- "Please enter a valid email address."

#### Password Reset

**Before**
- "No identity token received"
- "Failed to reset password"
- "Same as the old password"

**After**
- "Unable to send password reset email. Please try again."
- "Unable to reset password. Please try again."
- "New password must be different from your current password."

#### Apple Sign In

**Before**
- "No identity token received"
- "Failed to sign in with Apple"

**After**
- "Unable to verify your Apple ID. Please try again."
- "Unable to sign in with Apple. Please try again or use email sign in."

**Impact**: Users know exactly what's wrong and what alternative actions they can take.

---

### 3. Session/Authorization Errors

#### Before
- "No active session. Please log in again."
- "No user session found"
- "User ID is required"
- "not authenticated"

#### After
- "Your session has expired. Please sign in again."
- "You must be signed in to delete your account."
- "Your session has expired. Please sign in again." (for missing user ID)

**Impact**: Users understand they need to sign in again without technical details about sessions.

---

### 4. API/Server Errors

#### Before
- "Failed to send message"
- "Unknown error"
- Status 500/400/429 with generic messages

#### After
- "Unable to send your message. Please try again."
- "Our servers are experiencing issues. Please try again in a moment."
- "You have reached your message limit. Please upgrade to continue."
- "You have reached your daily message limit. Upgrade to Premium for unlimited messages."

**Impact**: Clear messaging about rate limits with upgrade call-to-action.

---

### 5. Validation Errors

#### Before
- "ID is required"
- "User ID is required"
- "Conversation ID is required"
- "Value cannot be empty"

#### After
- "Please provide a valid ID" (generic IDs)
- "Your session has expired. Please sign in again." (missing user ID)
- "Unable to find conversation. Please try refreshing." (missing conversation ID)
- "Message content cannot be empty"

**Impact**: Errors provide context about what happened and what to do next.

---

### 6. Account Management

#### Before
- "Failed to delete account"
- "No user session found"
- Generic error messages

#### After
- "Unable to delete account. Please try again or contact support."
- "You must be signed in to delete your account."

**Impact**: Clear guidance with escalation path to support when needed.

---

## Implementation Details

### Core Files Modified

#### `/utils/api.ts`
- Connection errors: "Unable to connect" instead of "Supabase configuration missing"
- Session errors: User-friendly session expiration messages
- HTTP status-based error messages with specific guidance
- Rate limit messages with upgrade prompts

#### `/utils/AuthContext.tsx`
- Sign in errors: Specific messages for wrong credentials, unverified email, rate limiting
- Sign up errors: Duplicate account, password requirements, email validation
- Apple Sign In: Clear alternative action (use email sign in)
- Password reset: Specific validation messages
- Account deletion: Friendly error with support escalation

#### `/utils/validation.ts`
- Session validation: User-friendly expired session messages
- Conversation errors: "Unable to find conversation" instead of "Conversation ID is required"
- All validation errors include helpful status codes (401, 404, 400)

#### `/utils/errorHandler.ts`
- Already had good user messages
- Categorizes errors appropriately
- Provides recovery actions for each error type

---

## Error Display Patterns

### Network Errors
```
Unable to connect. Please check your internet connection and try again.
```
Recovery actions:
- Check internet connection
- Try again in a few moments
- Switch to different network

### Authentication Errors
```
Your session has expired. Please sign in again.
```
Recovery actions:
- Sign in again
- Clear browser cache
- Contact support if issue persists

### Rate Limit Errors
```
You have reached your daily message limit. Upgrade to Premium for unlimited messages.
```
Recovery actions:
- Upgrade to Premium
- Wait until daily limit resets
- Review subscription status

### Server Errors
```
Our servers are experiencing issues. Please try again in a moment.
```
Recovery actions:
- Wait a few moments and try again
- Check status page
- Contact support if issue continues

---

## Testing Error Messages

### Manual Testing Scenarios

#### Connection Errors
1. Turn off internet connection
2. Try to send a message
3. Should see: "Unable to connect. Please check your internet connection and try again."

#### Authentication Errors
1. Try signing in with wrong password
2. Should see: "Incorrect email or password. Please try again."

3. Try signing up with existing email
4. Should see: "An account with this email already exists. Please sign in instead."

5. Try signing up with short password (< 6 chars)
6. Should see: "Password must be at least 6 characters long."

#### Rate Limit Errors
1. Send messages until hitting daily limit
2. Should see: "You have reached your daily message limit. Upgrade to Premium for unlimited messages."

#### Session Errors
1. Let session expire (or manually clear token)
2. Try to send a message
3. Should see: "Your session has expired. Please sign in again."

---

## Future Improvements

### 1. Error Tracking
- Add analytics to track which errors users encounter most
- Identify patterns that need better UX solutions
- A/B test different error message variations

### 2. Contextual Help
- Add help links to error messages
- Show relevant FAQ articles based on error type
- In-app support chat for persistent errors

### 3. Error Prevention
- Validate inputs before submission
- Show inline warnings before errors occur
- Better loading states to set expectations

### 4. Localization
- Translate all error messages
- Cultural adaptation of tone
- Regional support contact info

### 5. Accessibility
- Screen reader friendly error announcements
- High contrast error displays
- Keyboard navigation for error dismissal

---

## Error Message Writing Guidelines

When writing new error messages:

### DO
- Use simple, everyday language
- Be specific about what went wrong
- Suggest a clear next action
- Include helpful context
- End with period for complete sentences

### DON'T
- Use technical jargon or code terms
- Blame the user ("You failed to...")
- Use multiple exclamation points
- Include stack traces or error codes
- Say "Oops!" or similar casual language

### Examples

**Good**
- "Unable to send your message. Please check your internet connection and try again."
- "Your session has expired. Please sign in again."
- "Password must be at least 6 characters long."

**Bad**
- "Error: Network timeout after 30000ms"
- "You didn't enter a valid password"
- "Oops! Something went wrong!!!"
- "SUPABASE_URL is undefined"

---

## Monitoring and Metrics

Track these metrics to measure error message effectiveness:

1. **Error Recovery Rate**: % of users who successfully recover after seeing error
2. **Support Tickets**: Reduction in support requests for common errors
3. **Error Recurrence**: How often same user sees same error
4. **User Satisfaction**: Ratings after error resolution
5. **Alternative Action Usage**: % of users who use suggested alternatives (e.g., "use email sign in")

---

## Summary

All error messages have been updated to:
- Remove technical jargon
- Provide clear, specific information
- Include actionable next steps
- Maintain consistent, respectful tone
- Guide users toward resolution

This improves user experience, reduces frustration, and decreases support burden.
