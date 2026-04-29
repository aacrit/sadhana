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
        {/*
          Content Security Policy — best-effort via <meta http-equiv>.
          GitHub Pages does not support custom response headers, so this
          is the only CSP-enforcement path available on the current host.
          Tuned for our stack:
            - 'unsafe-inline' on style: required by Framer Motion inline styles
            - 'wasm-unsafe-eval' on script: required by Tone.js / Pitchy WASM
            - https://*.supabase.co: data API + realtime
            - https://accounts.google.com: OAuth redirect
            - https://lh3.googleusercontent.com: Google profile avatars
            - data:/blob: media: required for Three.js textures + voice
              waveform analyser source nodes
          Notes:
            - Strict-Transport-Security, Permissions-Policy and Referrer-Policy
              CANNOT be set via <meta>. They live in /public/_headers below
              for hosts that read it (Cloudflare Pages, Netlify, Vercel).
              On GitHub Pages they are unenforced; HSTS comes from the
              github.io parent domain in practice.
        */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={[
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com",
            "img-src 'self' data: https://lh3.googleusercontent.com",
            "media-src 'self' blob:",
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self' data: https://fonts.gstatic.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self' https://accounts.google.com",
          ].join('; ')}
        />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <link rel="manifest" href="/sadhana/manifest.json" />
        <link rel="icon" href="/sadhana/icons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/sadhana/icons/icon-192.svg" />
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
