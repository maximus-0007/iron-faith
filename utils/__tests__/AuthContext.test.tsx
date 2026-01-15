import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '../supabase';
import { ReactNode } from 'react';

jest.mock('../supabase');

describe('AuthContext', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00.000Z',
  };

  const mockSession = {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
  };

  const mockAuthStateChangeCallback = jest.fn();
  let authStateChangeListener: ((event: string, session: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    authStateChangeListener = null;

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      authStateChangeListener = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth must be used within an AuthProvider'
      );

      (console.error as jest.Mock).mockRestore();
    });

    it('provides auth context when used within AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.signIn).toBeInstanceOf(Function);
      expect(result.current.signUp).toBeInstanceOf(Function);
      expect(result.current.signOut).toBeInstanceOf(Function);
    });
  });

  describe('AuthProvider initialization', () => {
    it('initializes with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.loading).toBe(true);
    });

    it('loads existing session on mount', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('sets up auth state change listener', () => {
      renderHook(() => useAuth(), { wrapper });

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('updates state when auth state changes', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        authStateChangeListener?.('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
      });
    });

    it('handles PASSWORD_RECOVERY event', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        authStateChangeListener?.('PASSWORD_RECOVERY', mockSession);
      });

      await waitFor(() => {
        expect(result.current.isRecoverySession).toBe(true);
      });
    });
  });

  describe('signIn', () => {
    it('signs in user successfully', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });

      expect(signInResult).toEqual({});
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('returns error on failed sign in', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrongpassword');
      });

      expect(signInResult).toEqual({ error: 'Invalid credentials' });
    });

    it('handles unexpected errors', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });

      expect(signInResult).toEqual({ error: 'An unexpected error occurred' });
    });
  });

  describe('signUp', () => {
    it('signs up user successfully', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password123');
      });

      expect(signUpResult).toEqual({});
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: undefined,
        },
      });
    });

    it('returns error when email already exists', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'User already exists' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('existing@example.com', 'password123');
      });

      expect(signUpResult).toEqual({ error: 'User already exists' });
    });

    it('handles unexpected errors', async () => {
      (supabase.auth.signUp as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password123');
      });

      expect(signUpResult).toEqual({ error: 'An unexpected error occurred' });
    });
  });

  describe('signOut', () => {
    it('signs out user successfully', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('requestPasswordReset', () => {
    it('requests password reset successfully', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.requestPasswordReset('test@example.com');
      });

      expect(resetResult).toEqual({});
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('reset-password'),
        })
      );
    });

    it('returns error on failed password reset', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.requestPasswordReset('nonexistent@example.com');
      });

      expect(resetResult).toEqual({ error: 'User not found' });
    });

    it('handles unexpected errors', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.requestPasswordReset('test@example.com');
      });

      expect(resetResult).toEqual({ error: 'An unexpected error occurred' });
    });
  });

  describe('resetPassword', () => {
    it('resets password successfully', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('newpassword123');
      });

      expect(resetResult).toEqual({});
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });

    it('returns error on failed password reset', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Password too weak' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('weak');
      });

      expect(resetResult).toEqual({ error: 'Password too weak' });
    });

    it('handles unexpected errors', async () => {
      (supabase.auth.updateUser as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('newpassword123');
      });

      expect(resetResult).toEqual({ error: 'An unexpected error occurred' });
    });
  });

  describe('clearRecoverySession', () => {
    it('clears recovery session flag', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        authStateChangeListener?.('PASSWORD_RECOVERY', mockSession);
      });

      await waitFor(() => {
        expect(result.current.isRecoverySession).toBe(true);
      });

      act(() => {
        result.current.clearRecoverySession();
      });

      expect(result.current.isRecoverySession).toBe(false);
    });
  });
});
