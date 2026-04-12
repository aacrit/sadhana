/**
 * Navbar.tsx — Persistent top navigation bar
 *
 * Fixed position, 48px height, glass-morphism background.
 * Three auth states:
 *   - Unauthenticated: "Sign in" saffron pill outline -> /auth
 *   - Guest: "Save progress" muted text -> /auth
 *   - Authenticated: avatar circle with level-color ring -> /profile
 *
 * Renders above all page content via layout.tsx.
 */

'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useAuth } from '../lib/auth';
import { getLevelColor } from '../lib/types';
import styles from '../styles/navbar.module.css';

export default function Navbar() {
  const { user, profile, loading, isGuest } = useAuth();

  // Determine display name initial for avatar
  const displayName = profile?.displayName || user?.email || 'S';
  const initial = displayName.charAt(0).toUpperCase();

  // Level color for avatar ring
  const levelColor = profile ? getLevelColor(profile.level) : 'var(--level-shishya)';

  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      {/* Left: logo mark linking to home */}
      <Link href="/" className={styles.logoLink} aria-label="Sadhana home">
        <Logo size={24} variant="icon" />
      </Link>

      {/* Right: auth state */}
      <div className={styles.authArea}>
        {loading ? (
          // Show nothing while loading to avoid flash
          <div className={styles.authPlaceholder} />
        ) : user ? (
          // Authenticated: avatar with level ring
          <Link
            href="/profile"
            className={styles.avatar}
            style={{ '--level-color': levelColor } as React.CSSProperties}
            aria-label="Your profile"
          >
            <span className={styles.avatarInitial}>{initial}</span>
          </Link>
        ) : isGuest ? (
          // Guest: muted save progress link
          <Link href="/auth" className={styles.saveLink}>
            Save progress
          </Link>
        ) : (
          // Unauthenticated: saffron pill sign in
          <Link href="/auth" className={styles.signinLink}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
