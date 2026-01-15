import { supabase } from './supabase';
import { checkUserIsPremium, checkUserIsOnTrial } from './revenueCat';

export interface UserUsage {
  messageCount: number;
  isPremium: boolean;
  messagesRemaining: number;
  isOnTrial: boolean;
  trialEndDate: Date | null;
}

const FREE_DAILY_LIMIT = 2;

export async function checkMessageLimit(userId: string): Promise<boolean> {
  try {
    const isOnTrial = await checkUserIsOnTrial(userId);

    if (isOnTrial) {
      return true;
    }

    const isPremium = await checkUserIsPremium(userId);

    if (isPremium) {
      return true;
    }

    const { data, error } = await supabase.rpc('check_message_limit', {
      user_uuid: userId,
    });

    if (error) {
      console.error('Error checking message limit:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in checkMessageLimit:', error);
    return false;
  }
}

export async function incrementMessageCount(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_message_count', {
      user_uuid: userId,
    });

    if (error) {
      console.error('Error incrementing message count:', error);
    }
  } catch (error) {
    console.error('Error in incrementMessageCount:', error);
  }
}

export async function getUserUsage(userId: string): Promise<UserUsage | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_usage', {
      user_uuid: userId,
    });

    if (error) {
      console.error('Error getting user usage:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        messageCount: 0,
        isPremium: false,
        messagesRemaining: FREE_DAILY_LIMIT,
        isOnTrial: false,
        trialEndDate: null,
      };
    }

    const result = data[0];
    return {
      messageCount: result.message_count,
      isPremium: result.is_premium,
      messagesRemaining: result.messages_remaining === -1 ? 999999 : result.messages_remaining,
      isOnTrial: result.is_on_trial,
      trialEndDate: result.trial_end_date ? new Date(result.trial_end_date) : null,
    };
  } catch (error) {
    console.error('Error in getUserUsage:', error);
    return null;
  }
}
