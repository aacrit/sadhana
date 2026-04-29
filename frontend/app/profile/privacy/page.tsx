'use client';

/**
 * /profile/privacy — Account deletion + data export (audit #4).
 *
 * GDPR / India DPDP / Brazil LGPD floor. Two operations:
 *   - Export my data: triggers export_my_data() RPC, serialises the
 *     returned JSON, offers it as a download.
 *   - Delete my account: triggers delete_my_account() RPC after a
 *     two-step confirm. Hard-deletes user-scoped rows; auth.users row
 *     is reaped by a periodic admin pass.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth';
import { deleteMyAccount, exportMyData } from '../../lib/supabase';
import { emit } from '../../lib/telemetry';
import styles from '../profile.module.css';

export default function ProfilePrivacyPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Two-step confirm UI to prevent slip-of-finger deletions.
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportMyData();
      void emit('data-exported');
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const ts = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sadhana-export-${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyAccount();
      void emit('account-deleted');
      await signOut();
      router.replace('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Deletion failed');
      setDeleting(false);
    }
  }, [signOut, router]);

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p>Please sign in to manage your data.</p>
          <Link href="/auth" className={styles.signOutButton}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container} style={{ maxWidth: 560 }}>
        <Link href="/profile" className={styles.backButton} aria-label="Back to profile">
          ← Profile
        </Link>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-3xl)', letterSpacing: 'var(--tracking-royal)', color: 'var(--text)' }}>
          Your data
        </h1>

        {/* Export */}
        <section style={{ marginTop: 'var(--space-8)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-xl)', color: 'var(--text)', marginBottom: 'var(--space-2)' }}>
            Download your data
          </h2>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--text-md)', color: 'var(--text-2)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-4)' }}>
            Every session, every streak, every note recorded against your
            account — as a single JSON file. Yours to keep.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-md)',
              color: 'var(--accent)',
              background: 'transparent',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-full)',
              cursor: exporting ? 'wait' : 'pointer',
              opacity: exporting ? 0.6 : 1,
            }}
          >
            {exporting ? 'Preparing…' : 'Download JSON'}
          </button>
          {exportError && (
            <p style={{ color: 'var(--needs-work)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>{exportError}</p>
          )}
        </section>

        {/* Delete */}
        <section style={{ marginTop: 'var(--space-12)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-xl)', color: 'var(--text)', marginBottom: 'var(--space-2)' }}>
            Delete account
          </h2>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--text-md)', color: 'var(--text-2)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-4)' }}>
            Permanent. Irreversible. Every session, every streak, every
            recorded swara — gone within minutes.
          </p>

          {confirmStep === 0 && (
            <button
              type="button"
              onClick={() => setConfirmStep(1)}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--needs-work)',
                background: 'transparent',
                border: '1px solid var(--needs-work)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
              }}
            >
              Begin deletion
            </button>
          )}

          {confirmStep === 1 && (
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginBottom: 'var(--space-3)' }}>
                Are you sure? Type <strong>delete my account</strong> to confirm.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete my account"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  marginRight: 'var(--space-2)',
                  width: 240,
                }}
              />
              <button
                type="button"
                onClick={() => setConfirmStep(2)}
                disabled={confirmText.trim() !== 'delete my account'}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--needs-work)',
                  background: 'transparent',
                  border: '1px solid var(--needs-work)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: confirmText.trim() === 'delete my account' ? 'pointer' : 'not-allowed',
                  opacity: confirmText.trim() === 'delete my account' ? 1 : 0.4,
                }}
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => { setConfirmStep(0); setConfirmText(''); }}
                style={{
                  marginLeft: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-2)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {confirmStep === 2 && (
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--needs-work)', marginBottom: 'var(--space-3)' }}>
                Final confirmation. This will sign you out immediately.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  color: 'white',
                  background: 'var(--needs-work)',
                  border: '1px solid var(--needs-work)',
                  borderRadius: 'var(--radius-full)',
                  cursor: deleting ? 'wait' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Delete my account'}
              </button>
              {deleteError && (
                <p style={{ color: 'var(--needs-work)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>{deleteError}</p>
              )}
            </div>
          )}
        </section>

        <section style={{ marginTop: 'var(--space-12)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-3)', lineHeight: 'var(--leading-relaxed)' }}>
            Read our{' '}
            <Link href="/legal/privacy" style={{ color: 'var(--text-2)' }}>privacy policy</Link>
            {' '}and{' '}
            <Link href="/legal/terms" style={{ color: 'var(--text-2)' }}>terms of use</Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
