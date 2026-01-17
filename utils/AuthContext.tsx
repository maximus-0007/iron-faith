import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isRecoverySession: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  resetPassword: (password: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
  clearRecoverySession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function friendlyAuthError(message: string) {
  const msg = message.toLowerCase();

  if (msg.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (msg.includes('email not confirmed')) return 'Email not confirmed. Check your inbox and confirm your email.';
  if (msg.includes('too many requests')) return 'Too many attempts. Wait a minute and try again.';
  if (msg.includes('user already registered')) return 'An account with this email already exists. Please sign in.';
  if (msg.includes('password should be')) return 'Password must be at least 6 characters.';
  if (msg.includes('invalid email')) return 'Please enter a valid email address.';

  return 'Authentication failed. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  function clearRecoverySession() {
    setIsRecoverySession(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        // Helps you catch the #1 issue: env vars missing in TestFlight
        // (If supabaseUrl/anonKey are undefined, your supabase client is doomed.)
        // You can also log inside ./supabase for even more certainty.
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.log('SUPABASE getSession ERROR:', {
            message: error.message,
            status: (error as any).status,
            name: (error as any).name,
          });
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (e: any) {
        console.log('BOOTSTRAP CATCH:', e?.message ?? e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      (async () => {
        // Keep this minimal, avoid side effects here until auth is stable.
        console.log('AUTH STATE CHANGE:', event);

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoverySession(true);
        }

        // If you're doing RevenueCat or profile creation, do it here carefully.
        // if (event === 'SIGNED_IN' && nextSession?.user) { ... }

        setLoading(false);
      })();
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<{ error?: string }> {
    try {
      const emailTrimmed = normalizeEmail(email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (error) {
        console.log('SUPABASE SIGNIN ERROR:', {
          message: error.message,
          status: (error as any).status,
          name: (error as any).name,
        });
        return { error: friendlyAuthError(error.message) };
      }

      console.log('SUPABASE SIGNIN OK:', {
        userId: data?.user?.id,
        email: data?.user?.email,
        hasSession: !!data?.session,
      });

      return {};
    } catch (e: any) {
      console.log('SIGNIN CATCH:', e?.message ?? e);
      return { error: 'Network/app error. Try again.' };
    }
  }

  async function signUp(email: string, password: string): Promise<{ error?: string }> {
    try {
      const emailTrimmed = normalizeEmail(email);

      const { data, error } = await supabase.auth.signUp({
        email: emailTrimmed,
        password,
        options: {
          // If you require email confirm, Supabase will email them.
          // Leave undefined unless you're doing deep links for confirm.
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        console.log('SUPABASE SIGNUP ERROR:', {
          message: error.message,
          status: (error as any).status,
          name: (error as any).name,
        });
        return { error: friendlyAuthError(error.message) };
      }

      console.log('SUPABASE SIGNUP OK:', {
        userId: data?.user?.id,
        email: data?.user?.email,
        hasSession: !!data?.session,
      });

      // Important: if email confirmation is ON, data.session may be null.
      // That is not “broken”. It means they must confirm email first.
      if (!data.session) {
        return { error: 'Check your email to confirm your account, then sign in.' };
      }

      return {};
    } catch (e: any) {
      console.log('SIGNUP CATCH:', e?.message ?? e);
      return { error: 'Network/app error. Try again.' };
    }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async function requestPasswordReset(email: string): Promise<{ error?: string }> {
    try {
      const emailTrimmed = normalizeEmail(email);

      // Web: use current origin. Native: use scheme deep link.
      const redirectTo =
        Platform.OS === 'web'
          ? (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : 'http://localhost:8081/reset-password')
          : 'ironfaith://reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(emailTrimmed, { redirectTo });

      if (error) {
        console.log('SUPABASE RESET EMAIL ERROR:', { message: error.message });
        return { error: friendlyAuthError(error.message) };
      }

      return {};
    } catch (e: any) {
      console.log('RESET REQUEST CATCH:', e?.message ?? e);
      return { error: 'Network/app error. Try again.' };
    }
  }

  async function resetPassword(password: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.log('SUPABASE UPDATE PASSWORD ERROR:', { message: error.message });
        return { error: friendlyAuthError(error.message) };
      }

      return {};
    } catch (e: any) {
      console.log('RESET PASSWORD CATCH:', e?.message ?? e);
      return { error: 'Network/app error. Try again.' };
    }
  }

  async function deleteAccount(): Promise<{ error?: string }> {
    try {
      if (!user?.id) return { error: 'You must be signed in to delete your account.' };

      const { data, error } = await supabase.rpc('delete_user_account', {
        user_uuid: user.id,
      });

      if (error) {
        console.log('DELETE ACCOUNT RPC ERROR:', { message: error.message });
        return { error: 'Unable to delete account. Please try again.' };
      }

      if (data && typeof data === 'object' && 'success' in data && !(data as any).success) {
        return { error: (data as any).error || 'Unable to delete account. Please try again.' };
      }

      await supabase.auth.signOut();
      return {};
    } catch (e: any) {
      console.log('DELETE ACCOUNT CATCH:', e?.message ?? e);
      return { error: 'Network/app error. Try again.' };
    }
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      isRecoverySession,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      resetPassword,
      deleteAccount,
      clearRecoverySession,
    }),
    [user, session, loading, isRecoverySession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
