# RevenueCat Setup Guide

## Overview

Iron Faith uses RevenueCat for iOS and Android in-app purchases. RevenueCat handles:
- Apple App Store billing
- Google Play Store billing
- Receipt validation
- Subscription management
- Entitlements

## Current Status

The RevenueCat integration is complete with:

1. **SDK Installed**: `react-native-purchases` and `react-native-purchases-ui`
2. **Platform-Specific API Keys**: Configured in `.env` file for iOS and Android
3. **Entitlement ID**: Set to `Iron Faith Pro`
4. **Integration Complete**:
   - RevenueCat initializes on app start with platform-specific keys
   - Subscription status syncs with Supabase
   - Native RevenueCat UI paywall (with custom fallback)
   - Message limits enforced for free users (5 messages/day)
   - Settings shows subscription status

## Next Steps

### 1. Configure RevenueCat Dashboard

1. Go to [https://app.revenuecat.com](https://app.revenuecat.com)
2. Create your app in the dashboard
3. Configure your products:
   - **IMPORTANT**: Create entitlement named exactly: `Iron Faith Pro`
   - Add subscription products (monthly, yearly, etc.)
   - Attach products to the `Iron Faith Pro` entitlement
4. Configure a Paywall in the RevenueCat Dashboard:
   - Go to Paywalls section
   - Create a new paywall with your branding
   - Set it as the default offering
5. Get your production API keys (separate for iOS and Android)

### 2. Update API Keys

Replace the test keys in `.env`:
```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_production_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_production_key_here
```

### 3. Configure App Store Connect

1. Create your app in App Store Connect
2. Set up in-app purchases:
   - Create subscription groups
   - Add subscription products
3. Link products to RevenueCat

### 4. Configure Google Play Console

1. Create your app in Google Play Console
2. Set up in-app purchases:
   - Create subscription products
3. Link products to RevenueCat

### 5. Test Purchases

Before going live:
- Test on real devices (not simulators)
- Use sandbox accounts for testing
- Verify receipt validation
- Test restore purchases
- Test subscription status sync

### 6. Build for Native

Since RevenueCat requires native code:

```bash
# Create development build
npx expo prebuild
eas build --profile development --platform ios

# Or for local development
npx expo run:ios
npx expo run:android
```

## How It Works

### Message Limits
- Free users: 5 messages per day
- Premium users (with `Iron Faith Pro` entitlement): Unlimited messages
- Limit checked via `messageLimit.ts`

### Subscription Status
- RevenueCat syncs to Supabase `subscriptions` table
- Status updates automatically when purchases occur
- Settings modal shows current subscription
- Checks for `Iron Faith Pro` entitlement

### Paywall
- Uses RevenueCat's native pre-built paywall UI by default
- Triggered when free users hit message limit
- Falls back to custom UI if needed (`useNativeUI={false}`)
- Handles purchase flow and restoration
- Updates UI immediately on success
- Configure paywall design in RevenueCat Dashboard

## Code Structure

- `utils/revenueCat.ts`: Core RevenueCat integration with platform-specific keys
  - `initializeRevenueCat()`: Configures SDK with iOS or Android key
  - `getSubscriptionStatus()`: Checks for `Iron Faith Pro` entitlement
  - `presentPaywall()`: Shows RevenueCat's native paywall UI
  - `purchasePackage()`: Manual purchase (for custom UI)
  - `restorePurchases()`: Restore previous purchases
- `components/PaywallModal.tsx`: Paywall wrapper with native UI support
  - Set `useNativeUI={true}` for RevenueCat's pre-built paywall
  - Set `useNativeUI={false}` for custom paywall design
- `utils/messageLimit.ts`: Message limit enforcement checking entitlements
- `app/_layout.tsx`: RevenueCat initialization on app start

## Important Notes

- RevenueCat only works on iOS/Android (not web)
- Requires native builds (Expo Dev Client or EAS)
- **Entitlement must be named exactly**: `Iron Faith Pro`
- Platform-specific API keys required for iOS and Android
- Configure a paywall in the RevenueCat Dashboard for native UI
- Test thoroughly before production release
- Monitor RevenueCat dashboard for metrics and analytics

## Paywall Options

### Option 1: Native RevenueCat UI (Default)
```typescript
<PaywallModal useNativeUI={true} />
```
- Uses RevenueCat's pre-built paywall
- Configure design in RevenueCat Dashboard
- Automatic A/B testing support
- Faster to implement

### Option 2: Custom Paywall UI
```typescript
<PaywallModal useNativeUI={false} />
```
- Custom-designed paywall
- Full control over appearance
- Manual implementation of offerings

## Checking Subscription Status

```typescript
import Purchases from 'react-native-purchases';

const customerInfo = await Purchases.getCustomerInfo();

if (typeof customerInfo.entitlements.active['Iron Faith Pro'] !== 'undefined') {
  // User has Iron Faith Pro - grant premium access
}
```

## Support

- RevenueCat Docs: https://www.revenuecat.com/docs
- Expo Integration: https://www.revenuecat.com/docs/getting-started/installation/expo
- Paywall Configuration: https://www.revenuecat.com/docs/displaying-products/paywalls
