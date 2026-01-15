# Subscription Management

This document describes the subscription management features in Iron Faith.

## Features

### 1. Visual Trial Tracking

#### Trial Days Banner
- Displays prominently at the top of ChatScreen
- Shows days remaining in trial period
- Color-coded urgency:
  - Green: 3+ days remaining
  - Amber: 2 days remaining
  - Red: Last day of trial
- Tappable to upgrade directly to premium

#### Trial Status in Settings
- Shows "Free Trial Active" card with days remaining
- Displays exact trial end date
- Clear call-to-action to subscribe

### 2. Subscription Management

#### Manage Subscription Button
- Available for active premium subscribers in Settings
- Opens native app store subscription management
- Uses RevenueCat's `showManageSubscriptions()` API
- Platform-specific:
  - iOS: Opens App Store subscriptions
  - Android: Opens Google Play subscriptions
  - Web: Shows not available message

#### Subscription Status Display
- **Premium**: Shows Crown icon, "Unlimited conversations"
- **Trial**: Shows Zap icon, days remaining, upgrade button
- **Free**: Shows free tier limits, upgrade button

### 3. Restore Purchases

#### Automatic Restore on First Launch
- Automatically attempts to restore purchases when user first logs in
- Only runs once per user (tracked in AsyncStorage)
- Silently restores without user interaction
- Prevents loss of subscription when reinstalling app

#### Manual Restore
- "Restore Purchases" button available in Settings for all users
- Shows success/failure alert
- Refreshes subscription status after restore
- Helpful for users who purchased on another device

### 4. Subscription State Management

#### Real-time Status Updates
- Subscription status refreshed on:
  - App launch / user login
  - After successful purchase
  - After restore purchases
  - When opening Settings modal
- RevenueCat listener updates Supabase in real-time

#### Trial Expiration Handling
- Automatically checks trial end date
- Updates database when trial expires
- Seamlessly transitions from trial to free tier

## Implementation Details

### Core Files

#### `utils/revenueCat.ts`
Handles all RevenueCat operations:
- `getSubscriptionStatus()` - Get current subscription state with trial info
- `initializeRevenueCat(userId)` - Initialize RevenueCat SDK
- `openManageSubscriptions()` - Open native subscription management
- `restorePurchases()` - Restore previous purchases
- `presentPaywall()` - Show native paywall
- `syncSubscriptionStatus()` - Sync RevenueCat state to Supabase

#### `components/SubscriptionBanner.tsx`
Visual trial countdown banner:
- Displays days remaining in trial
- Color-coded urgency levels
- Tappable to upgrade
- Auto-hides when not on trial or premium

#### `components/SettingsModal.tsx`
Subscription management UI:
- Shows current subscription status
- "Manage Subscription" button (premium users)
- "Restore Purchases" button (all users)
- Trial day countdown display
- Upgrade buttons with clear CTAs

#### `utils/AuthContext.tsx`
Handles first-launch restore:
- Initializes RevenueCat on login
- Checks if restore has been attempted
- Silently restores purchases on first launch
- Tracks restore status per user

## User Flows

### Flow 1: New Trial User
1. User signs up for account
2. Receives 3-day trial automatically
3. Sees green trial banner: "3 Days Left in Trial"
4. Can tap banner to see upgrade options
5. In Settings, sees "Free Trial Active" with days remaining

### Flow 2: Trial About to Expire
1. User has 1 day left in trial
2. Sees red trial banner: "Last Day of Trial"
3. Banner urges: "Upgrade now to continue unlimited access"
4. Can tap banner or Settings to upgrade
5. After upgrading, banner disappears and Settings shows "Premium Member"

### Flow 3: Reinstalling App (Premium User)
1. User reinstalls app and logs in
2. AuthContext automatically attempts restore purchases
3. If purchase found, subscription activated silently
4. User sees "Premium Member" status immediately
5. No trial banner shown

### Flow 4: Managing Existing Subscription
1. Premium user opens Settings
2. Sees "Premium Member" card
3. Taps "Manage Subscription"
4. App Store/Play Store subscription settings open
5. Can cancel, change plan, view renewal date

### Flow 5: Manual Restore on New Device
1. User logs in on new device
2. Automatic restore happens but user unsure
3. Goes to Settings
4. Taps "Restore Purchases"
5. Alert confirms: "Your purchase has been restored successfully!"
6. Subscription status updates to Premium

## Database Schema

### user_subscriptions table
```sql
- user_id (uuid, primary key)
- subscription_status (text: 'active' | 'inactive')
- is_on_trial (boolean)
- trial_end_date (timestamptz, nullable)
- stripe_subscription_id (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Trial System
- New users automatically get 3-day trial (handled by database trigger)
- Trial end date calculated as signup time + 3 days
- `is_on_trial` flag indicates active trial
- Trial expiration checked on app launch and status refresh

## Platform Support

### iOS
- Full RevenueCat integration
- Native App Store subscriptions
- StoreKit 2 support
- Automatic restore on first launch
- Manage subscription in App Store

### Android
- Full RevenueCat integration
- Google Play Billing Library v5
- Automatic restore on first launch
- Manage subscription in Play Store

### Web
- Graceful degradation
- Shows "Not available on web" messages
- Links to mobile download (future enhancement)
- Still shows trial status from database

## Testing

### Manual Testing Checklist
- [ ] Trial banner shows with correct days remaining
- [ ] Trial banner color changes based on urgency
- [ ] Tapping trial banner opens paywall
- [ ] Settings shows correct subscription status
- [ ] Manage Subscription button opens App Store/Play Store
- [ ] Restore Purchases works and shows success message
- [ ] Automatic restore works on first launch
- [ ] Trial expiration handled correctly
- [ ] Premium status persists after app restart
- [ ] Subscription status updates after purchase

### Testing Trial Countdown
1. Create new account (gets 3-day trial)
2. Check banner shows "3 Days Left"
3. Manually update trial_end_date in database to tomorrow
4. Restart app, should show "1 Day Left" with amber color
5. Update to today, should show "Last Day" with red color
6. Update to yesterday, banner should disappear

### Testing Restore Purchases
1. Subscribe to premium on Device A
2. Install app on Device B with same Apple/Google account
3. Sign in - should auto-restore (check logs)
4. If not, tap "Restore Purchases" in Settings
5. Should see "Success" alert
6. Settings should show "Premium Member"

## Troubleshooting

### Purchase Not Restoring
- Check RevenueCat dashboard for user ID mapping
- Verify same Apple/Google account is used
- Try manual "Restore Purchases" button
- Check console logs for error messages

### Trial Not Showing
- Verify `is_on_trial` is true in database
- Check `trial_end_date` is in the future
- Ensure trial hasn't expired
- Check subscription status refresh logic

### Manage Subscription Not Opening
- Verify RevenueCat is initialized
- Check platform is iOS or Android (not web)
- Ensure user has active subscription
- Check RevenueCat logs for errors

## Future Enhancements

- [ ] Push notification 24 hours before trial expires
- [ ] Trial extension for referred users
- [ ] Special trial offers for returning users
- [ ] Family sharing support
- [ ] Promotional offers and discount codes
- [ ] Grace period for failed payments
- [ ] Subscription analytics dashboard
