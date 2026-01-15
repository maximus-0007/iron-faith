import { supabase } from './supabase';
import { getUserConversations, getConversationMessages } from './database';
import { createLogger } from './logger';

const logger = createLogger('userDataExport');

export interface UserDataExport {
  exportedAt: string;
  userId: string;
  userEmail: string;
  profile: {
    name: string;
    about: string;
    relationshipStatus: string | null;
    hasChildren: boolean;
    careerStage: string | null;
    spiritualStruggles: string[];
    accountabilityGoals: string[];
    onboardingCompleted: boolean;
    createdAt: string;
  };
  subscription: {
    status: string;
    isOnTrial: boolean;
    trialStartDate: string | null;
    trialEndDate: string | null;
  };
  conversations: Array<{
    id: string;
    title: string;
    pinned: boolean;
    createdAt: string;
    updatedAt: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      createdAt: string;
    }>;
  }>;
  bookmarks: Array<{
    id: string;
    conversationId: string;
    messageId: string;
    note: string | null;
    createdAt: string;
  }>;
  translationPreferences: Array<{
    translationId: string;
    translationName: string;
    translationAbbreviation: string;
    isEnabled: boolean;
  }>;
  statistics: {
    totalConversations: number;
    totalMessages: number;
    totalBookmarks: number;
    accountAge: string;
  };
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  try {
    logger.debug('Starting user data export', { userId });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const conversations = await getUserConversations(userId);

    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await getConversationMessages(conv.id);
        return {
          id: conv.id,
          title: conv.title,
          pinned: (conv as any).pinned || false,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.created_at,
          })),
        };
      })
    );

    const { data: bookmarks } = await supabase
      .from('message_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data: translationPrefs } = await supabase
      .from('user_translation_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    const totalMessages = conversationsWithMessages.reduce(
      (sum, conv) => sum + conv.messages.length,
      0
    );

    const accountAge = profile?.created_at
      ? calculateAccountAge(profile.created_at)
      : 'Unknown';

    await supabase
      .from('user_profiles')
      .update({ last_data_export_at: new Date().toISOString() })
      .eq('user_id', userId);

    const exportData: UserDataExport = {
      exportedAt: new Date().toISOString(),
      userId,
      userEmail: user.email || '',
      profile: {
        name: profile?.name || '',
        about: profile?.about || '',
        relationshipStatus: profile?.relationship_status || null,
        hasChildren: profile?.has_children || false,
        careerStage: profile?.career_stage || null,
        spiritualStruggles: profile?.spiritual_struggles || [],
        accountabilityGoals: profile?.accountability_goals || [],
        onboardingCompleted: profile?.onboarding_completed || false,
        createdAt: profile?.created_at || '',
      },
      subscription: {
        status: subscription?.subscription_status || 'inactive',
        isOnTrial: subscription?.is_on_trial || false,
        trialStartDate: subscription?.trial_start_date || null,
        trialEndDate: subscription?.trial_end_date || null,
      },
      conversations: conversationsWithMessages,
      bookmarks: (bookmarks || []).map(bm => ({
        id: bm.id,
        conversationId: bm.conversation_id,
        messageId: bm.message_id,
        note: bm.note,
        createdAt: bm.created_at,
      })),
      translationPreferences: (translationPrefs || []).map(tp => ({
        translationId: tp.translation_id,
        translationName: tp.translation_name,
        translationAbbreviation: tp.translation_abbreviation,
        isEnabled: tp.is_enabled,
      })),
      statistics: {
        totalConversations: conversations.length,
        totalMessages,
        totalBookmarks: bookmarks?.length || 0,
        accountAge,
      },
    };

    logger.debug('User data export completed', { userId });
    return exportData;
  } catch (error) {
    logger.error('Failed to export user data', error, { userId });
    throw error;
  }
}

function calculateAccountAge(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  return months > 0 ? `${years} years, ${months} months` : `${years} years`;
}

export async function downloadUserDataAsJSON(userId: string): Promise<string> {
  const data = await exportUserData(userId);
  return JSON.stringify(data, null, 2);
}
