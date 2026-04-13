/**
 * layout.tsx — Root layout for the Sadhana app.
 *
 * - Loads the four type voices via next/font/google (Ragamala design system)
 * - Sets default dark theme (data-theme="night")
 * - Provides metadata and viewport for mobile
 * - Wraps children in a semantic main element
 */

import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Noto_Serif_Devanagari, Inter, IBM_Plex_Mono } from 'next/font/google';
import Providers from './providers';
import './globals.css';
import ServiceWorkerRegistrar from './components/ServiceWorkerRegistrar';
import AuthPill from './components/AuthPill';

// ---------------------------------------------------------------------------
// Fonts — the four voices of Ragamala
// ---------------------------------------------------------------------------

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  display: 'swap',
  variable: '--font-serif',
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-devanagari',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-sans',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-mono',
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    default: 'Sadhana',
    template: '%s | Sadhana',
  },
  description:
    'A music physics engine. Not learning about music. Becoming it.',
  applicationName: 'Sadhana',
  keywords: [
    'Hindustani classical music',
    'raga',
    'sadhana',
    'ear training',
    'pitch detection',
    'tanpura',
    'sargam',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A1A14' },
    { media: '(prefers-color-scheme: light)', color: '#F5F0E8' },
  ],
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="night"
      className={`${cormorant.variable} ${notoSerifDevanagari.variable} ${inter.variable} ${ibmPlexMono.variable}`}
      data-script="devanagari"
    >
      <head>
        <link rel="manifest" href="/sadhana/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sadhana" />
      </head>
      <body>
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>
        <ServiceWorkerRegistrar />
        <Providers>
          <AuthPill />
          <main id="main-content">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
