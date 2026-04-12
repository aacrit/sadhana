'use client';

/**
 * Auth callback page -- Void design language.
 *
 * Handles OAuth redirect from Supabase.
 * Black void, centered logo, quiet "Signing you in..." text.
 * All redirect logic preserved exactly.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/Logo';
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
    <div className={styles.callbackPage}>
      <div className={styles.callbackContainer}>
        <Logo size={48} variant="icon" />
        <p className={styles.callbackText}>Signing you in...</p>
      </div>
    </div>
  );
}
