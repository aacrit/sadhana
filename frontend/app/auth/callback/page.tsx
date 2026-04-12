'use client';

/**
 * Auth callback page — handles OAuth redirect from Supabase.
 *
 * After Google OAuth, Supabase redirects here with a code in the URL hash.
 * The Supabase client automatically exchanges the code for a session.
 * This page waits for the session to resolve, then redirects to /.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import styles from '../auth.module.css';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase JS v2 handles the OAuth code exchange automatically
    // when onAuthStateChange fires. We just need to listen for it.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Small delay to let the auth state propagate
        setTimeout(() => {
          router.replace('/');
        }, 100);
      }
    });

    // Also check if session already exists (in case the event already fired)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.loadingDot} aria-label="Signing you in" />
        <p className={styles.loadingText}>Completing sign-in...</p>
      </div>
    </div>
  );
}
