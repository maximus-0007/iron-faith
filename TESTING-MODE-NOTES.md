# Testing Mode - Payment Restrictions Disabled

This document tracks changes made to temporarily disable payment restrictions for testing.

## Status: TESTING MODE ACTIVE

Payment restrictions have been disabled to allow unlimited testing before Apple Developer account approval.

## Changes Made

### 1. Edge Function: `supabase/functions/bibleChat/index.ts`

**Lines 150-191:** Message limit check is commented out
- Users can now send unlimited messages
- No 5-message daily limit enforced

**Lines 271-304:** Usage tracking is commented out
- Message counts are not being incremented
- Usage data is not being returned in responses

### 2. Frontend: `components/SubscriptionBadge.tsx`

**Lines 11-103:** Subscription badge replaced with "Testing Mode" indicator
- Shows green "Testing Mode" badge instead of usage counter
- All subscription logic is commented out but preserved

## How to Re-Enable Payment Restrictions

When your Apple Developer account is approved and you're ready to launch:

### Step 1: Restore Edge Function
1. Open `supabase/functions/bibleChat/index.ts`
2. Find lines 150-191 (message limit check)
3. Uncomment the entire block
4. Find lines 271-304 (usage tracking)
5. Uncomment the entire block
6. Redeploy the edge function

### Step 2: Restore Subscription Badge
1. Open `components/SubscriptionBadge.tsx`
2. Delete lines 14-27 (the testing mode return statement)
3. Uncomment lines 29-102 (the original subscription logic)
4. The badge will now show real usage/subscription status

### Step 3: Verify Everything Works
- Test that free users see "X/5" messages remaining
- Test that the limit blocks messages after 5
- Test that the pricing modal appears when limit is reached
- Verify Premium users see "Premium" badge and have unlimited access

## Important Notes

- All TODO comments mark exactly where changes need to be reverted
- Search for "TESTING MODE" in the codebase to find all modified sections
- The database schema and RLS policies are unchanged - they're ready for production
- Stripe integration code is unchanged - just reconnect when ready

## Current Testing Capabilities

With restrictions disabled, you can now:
- Send unlimited messages to test AI quality
- Test all conversation management features
- Validate settings and personalization
- Check performance with long conversations
- Test error handling and edge cases
- Verify the complete user experience

---

**Remember:** Before submitting to App Store, re-enable all payment restrictions!
