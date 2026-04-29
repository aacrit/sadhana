'use client';

/**
 * Auth page -- Void design language.
 *
 * A liminal threshold: pure black, elements floating in void.
 * The logo is the only warm element, breathing with saffron light.
 *
 * Three auth paths (logic untouched from auth.tsx):
 *   1. Google OAuth (prominent, full-width)
 *   2. Email/password (collapsed behind a text link)
 *   3. Guest entry (bottom, near-invisible)
 */

import { useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/auth';
import Logo from '../components/Logo';
import styles from './auth.module.css';

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp, setGuest, user } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // If already signed in, redirect to home
  if (user) {
    router.replace('/');
    return null;
  }

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error: authError } = await signIn('google');
    if (authError) {
      setError(authError.message);
    }
    // Google OAuth redirects away -- no further action needed
  };

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === 'signin') {
      const { error: authError } = await signIn('email', email, password);
      if (authError) {
        setError(authError.message);
      } else {
        router.replace('/');
      }
    } else {
      const { error: authError } = await signUp(email, password);
      if (authError) {
        setError(authError.message);
      } else {
        setError(null);
        // Supabase sends a confirmation email by default
        setMode('signin');
        setEmail('');
        setPassword('');
        // Show a note about email confirmation
        setError('Check your email to confirm your account, then sign in.');
      }
    }

    setSubmitting(false);
  };

  const handleGuestContinue = useCallback(() => {
    setGuest();
    router.replace('/');
  }, [setGuest, router]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setError(null);
  }, []);

  const toggleEmailForm = useCallback(() => {
    setIsEmailOpen((prev) => !prev);
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Logo with saffron glow */}
        <div className={styles.logoWrap}>
          <div className={styles.logoGlow} aria-hidden="true" />
          <Logo size={64} variant="icon" />
        </div>

        {/* Heading */}
        <h1 className={styles.heading}>Begin your practice.</h1>
        <p className={styles.subheading}>
          Your Sa, your ragas, your riyaz — remembered.
        </p>

        {/* Google sign-in -- prominent */}
        <button
          type="button"
          className={styles.googleButton}
          onClick={handleGoogleSignIn}
          aria-label="Sign in with Google"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className={styles.divider} role="separator">
          <span className={styles.dividerText}>or</span>
        </div>

        {/* Email toggle -- collapsed by default */}
        <button
          type="button"
          className={styles.emailToggle}
          onClick={toggleEmailForm}
          aria-expanded={isEmailOpen}
          aria-controls="email-form-wrap"
        >
          {isEmailOpen ? 'Hide email sign-in' : 'Sign in with email \u2192'}
        </button>

        {/* Email form -- slides open */}
        <div
          id="email-form-wrap"
          className={`${styles.emailFormWrap} ${isEmailOpen ? styles.emailFormOpen : ''}`}
        >
          <form
            className={styles.form}
            onSubmit={handleEmailSubmit}
            noValidate
          >
            <label className={styles.label} htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              tabIndex={isEmailOpen ? 0 : -1}
            />

            <label className={styles.label} htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 10 characters"
              autoComplete={
                mode === 'signup' ? 'new-password' : 'current-password'
              }
              minLength={10}
              required
              tabIndex={isEmailOpen ? 0 : -1}
            />

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting || !email || (mode === 'signup' ? password.length < 10 : !password)}
              tabIndex={isEmailOpen ? 0 : -1}
            >
              {submitting
                ? 'Please wait...'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>

          {/* Toggle sign-in / sign-up -- only visible when email is open */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              className={styles.toggleLink}
              onClick={toggleMode}
              tabIndex={isEmailOpen ? 0 : -1}
            >
              {mode === 'signin'
                ? 'Need an account? Sign up'
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Guest link -- barely visible */}
        <Link
          href="/"
          className={styles.guestLink}
          onClick={(e) => {
            e.preventDefault();
            handleGuestContinue();
          }}
        >
          Enter without an account
        </Link>
      </div>
    </div>
  );
}
