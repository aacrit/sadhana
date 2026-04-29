import Link from 'next/link';
import styles from '../privacy/legal.module.css';

export const metadata = {
  title: 'Terms of Use',
};

export default function TermsPage() {
  return (
    <article className={styles.page}>
      <Link href="/" className={styles.back}>← Sādhanā</Link>

      <h1 className={styles.title}>Terms of Use</h1>
      <p className={styles.updated}>Last updated 2026-04-29</p>

      <h2>Acceptance</h2>
      <p>
        By using Sādhanā, you agree to these terms. If you do not agree,
        do not use the application.
      </p>

      <h2>The service</h2>
      <p>
        Sādhanā is a Hindustani-classical-music practice tool. It provides
        a music engine, guided lessons, and pitch feedback. It does not
        replace a human teacher and makes no claim to do so. The
        application is offered as-is, without warranty of musical
        correctness for traditions outside Hindustani classical music.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for the accuracy of the information associated
        with your account and for keeping your auth credentials secure.
        Do not share your account with others.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not attempt to interfere with the operation of the service, do
        not attempt to access another user&rsquo;s data, and do not use
        the service in any way that would violate applicable law.
      </p>

      <h2>Microphone permission</h2>
      <p>
        Sādhanā requests microphone access to detect your voice&rsquo;s
        pitch in real time. We do not record, store, or transmit audio.
        You can revoke microphone permission at any time from your
        browser&rsquo;s site settings.
      </p>

      <h2>Termination</h2>
      <p>
        You may delete your account at any time from{' '}
        <Link href="/profile/privacy">the privacy controls in your profile</Link>.
        We may terminate accounts that abuse the service.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Material changes will be announced on
        this page with a new &ldquo;Last updated&rdquo; date.
      </p>

      <h2>Contact</h2>
      <p>
        Questions: <a href="mailto:aacrit@gmail.com">aacrit@gmail.com</a>.
      </p>
    </article>
  );
}
