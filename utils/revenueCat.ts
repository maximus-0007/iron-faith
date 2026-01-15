import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY!;
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY!;
const ENTITLEMENT_ID = 'Iron Faith Pro';

let isInitialized = false;

export interface SubscriptionInfo {
  isActive: boolean;
  isPremium: boolean;
  productId: string | null;
  expiresAt: Date | null;
  willRenew: boolean;
  isOnTrial: boolean;
  trialEndDate: Date | null;
}

export async function initializeRevenueCat(userId: string): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    if (Platform.OS === 'web') {
      console.log('RevenueCat is not available on web');
      return;
    }

    let apiKey: string | undefined;
    if (Platform.OS === 'ios') {
      apiKey = IOS_API_KEY;
    } else if (Platform.OS === 'android') {
      apiKey = ANDROID_API_KEY;
    }

    if (!apiKey) {
      console.warn('RevenueCat API key not configured for platform:', Platform.OS);
      return;
    }

    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    await Purchases.configure({
      apiKey: apiKey,
      appUserID: userId,
    });

    isInitialized = true;

    Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
      await syncSubscriptionStatus(userId, customerInfo);
    });

    const customerInfo = await Purchases.getCustomerInfo();
    await syncSubscriptionStatus(userId, customerInfo);

    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
}

export async function getSubscriptionStatus(): Promise<SubscriptionInfo> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        isActive: false,
        isPremium: false,
        productId: null,
        expiresAt: null,
        willRenew: false,
        isOnTrial: false,
        trialEndDate: null,
      };
    }

    const { data: subscriptionData } = await supabase
      .from('user_subscriptions')
      .select('subscription_status, is_on_trial, trial_end_date')
      .eq('user_id', user.id)
      .maybeSingle();

    const isOnTrial = subscriptionData?.is_on_trial || false;
    const trialEndDate = subscriptionData?.trial_end_date ? new Date(subscriptionData.trial_end_date) : null;

    if (trialEndDate && new Date() > trialEndDate) {
      await supabase
        .from('user_subscriptions')
        .update({ is_on_trial: false })
        .eq('user_id', user.id);
    }

    if (Platform.OS === 'web' || !isInitialized) {
      return {
        isActive: subscriptionData?.subscription_status === 'active',
        isPremium: subscriptionData?.subscription_status === 'active',
        productId: null,
        expiresAt: null,
        willRenew: false,
        isOnTrial: isOnTrial && trialEndDate ? new Date() < trialEndDate : false,
        trialEndDate,
      };
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (entitlement) {
      return {
        isActive: true,
        isPremium: true,
        productId: entitlement.productIdentifier,
        expiresAt: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
        willRenew: entitlement.willRenew,
        isOnTrial: false,
        trialEndDate: null,
      };
    }

    return {
      isActive: false,
      isPremium: false,
      productId: null,
      expiresAt: null,
      willRenew: false,
      isOnTrial: isOnTrial && trialEndDate ? new Date() < trialEndDate : false,
      trialEndDate,
    };
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return {
      isActive: false,
      isPremium: false,
      productId: null,
      expiresAt: null,
      willRenew: false,
      isOnTrial: false,
      trialEndDate: null,
    };
  }
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    if (Platform.OS === 'web' || !isInitialized) {
      return null;
    }

    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
}

export async function purchasePackage(packageToPurchase: PurchasesPackage): Promise<boolean> {
  try {
    if (Platform.OS === 'web' || !isInitialized) {
      console.warn('Purchases are not available on web');
      return false;
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    return isPremium;
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Purchase failed:', error);
    }
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    if (Platform.OS === 'web' || !isInitialized) {
      return false;
    }

    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    return isPremium;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return false;
  }
}

export async function presentPaywall(): Promise<boolean> {
  try {
    if (Platform.OS === 'web' || !isInitialized) {
      console.warn('RevenueCat UI is not available on web');
      return false;
    }

    const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

    switch (paywallResult) {
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      case PAYWALL_RESULT.CANCELLED:
        return false;
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.error('Failed to present paywall:', error);
    return false;
  }
}

async function syncSubscriptionStatus(
  userId: string,
  customerInfo: CustomerInfo
): Promise<void> {
  try {
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    const isActive = entitlement !== undefined;

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(
        {
          user_id: userId,
          subscription_status: isActive ? 'active' : 'inactive',
          stripe_subscription_id: entitlement?.productIdentifier || null,
          updated_at: new Date().toISOString(),
          is_on_trial: false,
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('Failed to sync subscription to Supabase:', error);
    }
  } catch (error) {
    console.error('Error syncing subscription:', error);
  }
}

export async function checkUserIsPremium(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('subscription_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking premium status:', error);
      return false;
    }

    return data?.subscription_status === 'active';
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

export async function checkUserIsOnTrial(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('is_on_trial, trial_end_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking trial status:', error);
      return false;
    }

    if (!data || !data.is_on_trial) {
      return false;
    }

    const trialEndDate = new Date(data.trial_end_date);
    const now = new Date();

    if (now > trialEndDate) {
      await supabase
        .from('user_subscriptions')
        .update({ is_on_trial: false })
        .eq('user_id', userId);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking trial status:', error);
    return false;
  }
}

export async function openManageSubscriptions(): Promise<void> {
  try {
    if (Platform.OS === 'web' || !isInitialized) {
      console.warn('Manage subscriptions is not available on web');
      return;
    }

    await Purchases.showManageSubscriptions();
  } catch (error) {
    console.error('Failed to open manage subscriptions:', error);
  }
}
