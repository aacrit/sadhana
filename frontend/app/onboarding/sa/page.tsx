'use client';

/**
 * /onboarding/sa — First-launch Sa calibration (audit #11).
 *
 * The locked architecture says auto-detect from voice on first session.
 * Without this, fresh students hit lessons with the C4 default (261.63 Hz)
 * which is uncomfortably high for most male Indian voices and many
 * female voices in HCM. They sing flat the whole first session, the app
 * says they're flat, they conclude the app is wrong.
 *
 * This page is the dedicated first-time flow. Students reach it via the
 * route guard below (see useFirstLaunchSaGuard). They can also reach it
 * voluntarily from /profile.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import SaCalibrator from '../../components/SaCalibrator';
import { useAuth } from '../../lib/auth';
import { emit } from '../../lib/telemetry';
import styles from '../../styles/onboarding.module.css';

export default function OnboardingSaPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  // The "next" query param tells us where to send the student after
  // calibration completes. Defaults to home.
  const next = searchParams.get('next') ?? '/';

  // Student already calibrated and arrived here directly — bounce them on.
  // We use a small threshold rather than equality because of float roundtrip.
  useEffect(() => {
    if (profile && profile.saHz && Math.abs(profile.saHz - 261.6256) > 0.5) {
      router.replace(next);
    }
  }, [profile, next, router]);

  useEffect(() => {
    void emit('sa-onboarding-shown');
  }, []);

  const handleSkip = () => {
    void emit('sa-onboarding-skipped');
    router.replace(next);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          <span className="romanized-only">Find your Sa</span>
          <span className="devanagari-only swara-text">अपनी सा खोजें</span>
        </h1>

        <p className={styles.body}>
          Every raga is anchored by Sa — the tonic. Yours is yours; not
          a fixed frequency. Sing or hum a comfortable note three to five
          times. Sādhanā will listen and remember.
        </p>

        <p className={styles.bodyDim}>
          Without this, your lessons will be tuned to C4 — comfortable for
          some voices, painful for others. Less than a minute now saves
          every lesson hereafter.
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setOpen(true)}
          >
            Begin
          </button>
          <Link href={next} onClick={handleSkip} className={styles.skipLink}>
            Skip for now
          </Link>
        </div>
      </div>

      <SaCalibrator
        open={open}
        onClose={() => {
          setOpen(false);
          // SaCalibrator persists Sa internally; bounce to next on close.
          router.replace(next);
        }}
      />
    </div>
  );
}
