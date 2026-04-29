import Link from 'next/link';
import styles from './legal.module.css';

export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicyPage() {
  return (
    <article className={styles.page}>
      <Link href="/" className={styles.back}>← Sādhanā</Link>

      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.updated}>Last updated 2026-04-29</p>

      <h2>What we collect</h2>
      <p>
        Sādhanā stores only what is required to run your practice: your
        email (from your auth provider), your detected Sa frequency, your
        practice sessions (raga, duration, accuracy, timestamps), and your
        streak. We do not collect — and have never collected — recordings
        of your voice. Pitch detection runs entirely in your browser; only
        the resulting numbers (frequency, cents deviation, swara symbol)
        are processed, and most of those never leave your device either.
      </p>

      <h2>What we share</h2>
      <p>
        Nothing. We do not sell, syndicate, or share your data with any
        third party. We do not run advertising. We do not embed third-party
        analytics. The only external service that ever sees your data is
        Supabase, the database we use to store your practice progress,
        operated under their standard data-processing terms.
      </p>

      <h2>Where it lives</h2>
      <p>
        Your account, profile, sessions, and streak rows are stored in
        Supabase. Audio is processed on-device and never uploaded.
      </p>

      <h2>Your rights</h2>
      <p>
        You can download every byte we store about you, or delete your
        account entirely, at any time, from the{' '}
        <Link href="/profile/privacy">privacy controls in your profile</Link>.
        Deletion is immediate and irreversible. Export returns a single
        JSON file containing every row tied to your account.
      </p>

      <h2>Cookies and storage</h2>
      <p>
        We use the browser&rsquo;s localStorage to remember your daily
        riyaz date, your preferred script (Devanagari or Romanized), and
        your reduced-motion preference. We do not use third-party cookies
        or trackers. Your auth provider (Google or Supabase email) sets
        its own session cookie; that is the only network-side cookie.
      </p>

      <h2>Children</h2>
      <p>
        Sādhanā is suitable for students of any age, but accounts must
        comply with the auth provider&rsquo;s minimum-age rules (typically
        13). Parents and guardians are welcome.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions: <a href="mailto:aacrit@gmail.com">aacrit@gmail.com</a>.
      </p>
    </article>
  );
}
