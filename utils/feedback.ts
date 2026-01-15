import { supabase } from './supabase';

export type FeedbackType = 'positive' | 'negative';

export interface MessageFeedback {
  id: string;
  message_id: string;
  user_id: string;
  feedback_type: FeedbackType;
  created_at: string;
  updated_at: string;
}

export async function getMessageFeedback(
  messageId: string,
  userId: string
): Promise<FeedbackType | null> {
  const { data, error } = await supabase
    .from('message_feedback')
    .select('feedback_type')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching message feedback:', error);
    return null;
  }

  return data?.feedback_type || null;
}

export async function setMessageFeedback(
  messageId: string,
  userId: string,
  feedbackType: FeedbackType
): Promise<boolean> {
  const { error } = await supabase
    .from('message_feedback')
    .upsert(
      {
        message_id: messageId,
        user_id: userId,
        feedback_type: feedbackType,
      },
      {
        onConflict: 'message_id,user_id',
      }
    );

  if (error) {
    console.error('Error setting message feedback:', error);
    return false;
  }

  return true;
}

export async function removeMessageFeedback(
  messageId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('message_feedback')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing message feedback:', error);
    return false;
  }

  return true;
}

export async function getConversationFeedback(
  conversationId: string,
  userId: string
): Promise<Map<string, FeedbackType>> {
  const { data, error } = await supabase
    .from('message_feedback')
    .select('message_id, feedback_type')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching conversation feedback:', error);
    return new Map();
  }

  const feedbackMap = new Map<string, FeedbackType>();
  data?.forEach((item) => {
    feedbackMap.set(item.message_id, item.feedback_type as FeedbackType);
  });

  return feedbackMap;
}
