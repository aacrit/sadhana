'use client';

/**
 * AuthPill — Minimal floating auth indicator (bottom-left).
 *
 * Replaces the Navbar. The app is centered around Tantri —
 * no persistent chrome should compete for vertical space.
 *
 * Three states:
 *   - Unauthenticated: small "Sign in" text
 *   - Guest: "Save" text
 *   - Authenticated: avatar initial with level ring
 *
 * Hidden on auth pages.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { getLevelColor } from '../lib/types';

export default function AuthPill() {
  const pathname = usePathname();
  const { user, profile, loading, isGuest } = useAuth();

  // Hide on auth pages
  if (pathname.startsWith('/auth')) return null;

  // Don't render while loading
  if (loading) return null;

  const levelColor = profile ? getLevelColor(profile.level) : 'var(--level-shishya)';
  const displayName = profile?.displayName || user?.email || 'S';
  const initial = displayName.charAt(0).toUpperCase();

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 'var(--space-6)',
    left: 'var(--space-4)',
    zIndex: 50,
    minWidth: 'var(--touch-min)',
    minHeight: 'var(--touch-min)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-full)',
    textDecoration: 'none',
    transition: 'opacity 0.2s ease',
  };

  if (user) {
    return (
      <Link
        href="/profile"
        aria-label="Your profile"
        style={{
          ...baseStyle,
          background: 'var(--bg-3)',
          boxShadow: `0 0 0 2px ${levelColor}`,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text)',
            lineHeight: 1,
          }}
        >
          {initial}
        </span>
      </Link>
    );
  }

  if (isGuest) {
    return (
      <Link
        href="/auth"
        aria-label="Save your progress"
        style={{
          ...baseStyle,
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          padding: '0 var(--space-3)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-3)',
        }}
      >
        Save
      </Link>
    );
  }

  // Unauthenticated
  return (
    <Link
      href="/auth"
      aria-label="Sign in"
      style={{
        ...baseStyle,
        background: 'transparent',
        border: '1px solid rgba(232, 135, 30, 0.4)',
        padding: '0 var(--space-3)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-xs)',
        color: 'var(--accent)',
      }}
    >
      Sign in
    </Link>
  );
}
