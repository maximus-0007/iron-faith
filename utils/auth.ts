import { supabase } from './supabase';

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}
