import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { initializeRevenueCat, restorePurchases } from './revenueCat';
import storage from './storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isRecoverySession: boolean;
  clearRecoverySession: () => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  resetPassword: (newPassword: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  function clearRecoverySession() {
    setIsRecoverySession(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await handleUserLogin(session.user.id);
      }

      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoverySession(true);
        }

        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserLogin(session.user.id);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleUserLogin(userId: string) {
    try {
      if (Platform.OS === 'web') {
        return;
      }

      await initializeRevenueCat(userId);

      const hasRestoredKey = `has_restored_purchases_${userId}`;
      const hasRestored = await storage.getItem(hasRestoredKey);

      if (!hasRestored) {
        console.log('First launch for user, attempting to restore purchases...');
        try {
          await restorePurchases();
          await storage.setItem(hasRestoredKey, 'true');
          console.log('Restore purchases attempted on first launch');
        } catch (error) {
          console.log('No purchases to restore or restore failed:', error);
        }
      }
    } catch (error) {
      console.error('Error during user login handling:', error);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Incorrect email or password. Please try again.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Please verify your email address before signing in.' };
        }
        if (error.message.includes('Too many requests')) {
          return { error: 'Too many sign in attempts. Please wait a moment and try again.' };
        }
        return { error: 'Unable to sign in. Please check your credentials and try again.' };
      }

      return {};
    } catch (error) {
      return { error: 'Unable to connect. Please check your internet connection and try again.' };
    }
  }

  async function signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'An account with this email already exists. Please sign in instead.' };
        }
        if (error.message.includes('Password should be')) {
          return { error: 'Password must be at least 6 characters long.' };
        }
        if (error.message.includes('invalid email')) {
          return { error: 'Please enter a valid email address.' };
        }
        return { error: 'Unable to create account. Please try again.' };
      }

      return {};
    } catch (error) {
      return { error: 'Unable to connect. Please check your internet connection and try again.' };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function requestPasswordReset(email: string) {
    try {
      let redirectUrl: string;

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          redirectUrl = `${window.location.origin}/reset-password`;
        } else {
          redirectUrl = 'http://localhost:8081/reset-password';
        }
      } else {
        redirectUrl = `${process.env.EXPO_PUBLIC_APP_URL || 'ironfaith://'}/reset-password`;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        if (error.message.includes('invalid email')) {
          return { error: 'Please enter a valid email address.' };
        }
        return { error: 'Unable to send password reset email. Please try again.' };
      }

      return {};
    } catch (error) {
      return { error: 'Unable to connect. Please check your internet connection and try again.' };
    }
  }

  async function resetPassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        if (error.message.includes('Password should be')) {
          return { error: 'Password must be at least 6 characters long.' };
        }
        if (error.message.includes('same as the old password')) {
          return { error: 'New password must be different from your current password.' };
        }
        return { error: 'Unable to reset password. Please try again.' };
      }

      return {};
    } catch (error) {
      return { error: 'Unable to connect. Please check your internet connection and try again.' };
    }
  }

  async function deleteAccount() {
    try {
      if (!user) {
        return { error: 'You must be signed in to delete your account.' };
      }

      const { data, error } = await supabase.rpc('delete_user_account', {
        user_uuid: user.id,
      });

      if (error) {
        return { error: 'Unable to delete account. Please try again or contact support.' };
      }

      if (data && !data.success) {
        return { error: 'Unable to delete account. Please try again or contact support.' };
      }

      return {};
    } catch (error: any) {
      return { error: 'Unable to connect. Please check your internet connection and try again.' };
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isRecoverySession, clearRecoverySession, signIn, signUp, signOut, requestPasswordReset, resetPassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
