'use client';

/**
 * @module frontend/lib/auth
 *
 * Authentication context and hook for Sadhana.
 *
 * Wraps Supabase onAuthStateChange and exposes:
 *   - user: the Supabase auth user (or null)
 *   - profile: the profiles + streaks row (or null)
 *   - loading: true while initial session check is in progress
 *   - signIn: sign in with Google or email/password
 *   - signOut: sign out and clear state
 *
 * Guest mode: if the user clicks "Continue as guest", a flag is stored
 * in localStorage. The hook exposes `isGuest` for UI branching.
 *
 * This module is SSR-safe: all localStorage and Supabase auth calls
 * are guarded behind typeof window checks or run inside useEffect.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getUserProfile } from './supabase';
import type { UserProfile } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GUEST_FLAG_KEY = 'sadhana_guest';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  /** Supabase auth user, or null if not authenticated. */
  readonly user: User | null;
  /** Profiles + streaks data, or null if not loaded / guest. */
  readonly profile: UserProfile | null;
  /** True while the initial auth session is being resolved. */
  readonly loading: boolean;
  /** True if the user chose "Continue as guest". */
  readonly isGuest: boolean;
  /** Sign in with Google OAuth or email/password. */
  signIn(
    provider: 'google' | 'email',
    email?: string,
    password?: string,
  ): Promise<{ error: AuthError | null }>;
  /** Sign up with email/password. */
  signUp(
    email: string,
    password: string,
  ): Promise<{ error: AuthError | null }>;
  /** Sign out and clear all auth state. */
  signOut(): Promise<void>;
  /** Set the guest flag in localStorage. */
  setGuest(): void;
  /** Re-fetch the profile from Supabase. */
  refreshProfile(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // -----------------------------------------------------------------------
  // Fetch profile helper
  // -----------------------------------------------------------------------

  const fetchProfile = useCallback(async (userId: string) => {
    const p = await getUserProfile(userId);
    setProfile(p);
  }, []);

  // -----------------------------------------------------------------------
  // Auth state listener
  // -----------------------------------------------------------------------

  useEffect(() => {
    // Check guest flag from localStorage
    if (typeof window !== 'undefined') {
      const guestFlag = localStorage.getItem(GUEST_FLAG_KEY);
      if (guestFlag === 'true') {
        setIsGuest(true);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // -----------------------------------------------------------------------
  // Sign in
  // -----------------------------------------------------------------------

  const signIn = useCallback(
    async (
      provider: 'google' | 'email',
      email?: string,
      password?: string,
    ): Promise<{ error: AuthError | null }> => {
      if (provider === 'google') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo:
              typeof window !== 'undefined'
                ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/auth/callback/`
                : undefined,
          },
        });
        return { error };
      }

      // Email/password sign in
      if (!email || !password) {
        return {
          error: {
            message: 'Email and password are required',
            name: 'AuthError',
            status: 400,
          } as AuthError,
        };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Sign up
  // -----------------------------------------------------------------------

  const signUp = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: AuthError | null }> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Sign out
  // -----------------------------------------------------------------------

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_FLAG_KEY);
    }
    setIsGuest(false);
  }, []);

  // -----------------------------------------------------------------------
  // Guest mode
  // -----------------------------------------------------------------------

  const setGuest = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_FLAG_KEY, 'true');
    }
    setIsGuest(true);
  }, []);

  // -----------------------------------------------------------------------
  // Refresh profile
  // -----------------------------------------------------------------------

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // -----------------------------------------------------------------------
  // Context value (memoized to avoid unnecessary re-renders)
  // -----------------------------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isGuest,
      signIn,
      signUp,
      signOut,
      setGuest,
      refreshProfile,
    }),
    [user, profile, loading, isGuest, signIn, signUp, signOut, setGuest, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the auth context. Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
