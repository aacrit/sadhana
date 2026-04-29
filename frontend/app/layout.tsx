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
  // Explicit fallback array so next/font's resolved CSS includes Devanagari-
  // capable system faces (not just generic serif). Without this, browsers
  // that fail to load the self-hosted .woff2 substitute the OS's default
  // serif (Times New Roman / Georgia) which has zero Devanagari coverage,
  // forcing a second silent fallback to whatever Devanagari face the OS
  // picks. Listing the system Devanagari faces explicitly stops the drift.
  fallback: ['Noto Sans Devanagari', 'Mangal', 'Devanagari MT', 'system-ui'],
  // Disable preload of the (large) Devanagari face from every page; preload
  // only on routes where Devanagari is rendered above the fold. (Setting
  // preload:false here means we control preload via <link> in pages that
  // need it; for now, swap-on-paint is acceptable since the romanized
  // labels render synchronously while Devanagari swaps in.)
  preload: false,
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

const SITE_URL = 'https://aacrit.github.io/sadhana';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Sādhanā — Hindustani classical music practice',
    template: '%s · Sādhanā',
  },
  description:
    'A music physics engine for Hindustani classical music. Tanpura drone, real-time pitch feedback against 22 shrutis, raga-aware practice. Free, no ads, no recordings.',
  applicationName: 'Sādhanā',
  keywords: [
    'Hindustani classical music',
    'raga',
    'sadhana',
    'sādhanā',
    'ear training',
    'pitch detection',
    'tanpura',
    'sargam',
    'shruti',
    'bhairav',
    'yaman',
    'bhoopali',
    'voice training',
    'Indian classical music app',
  ],
  authors: [{ name: 'Aacrit' }],
  creator: 'Aacrit',
  publisher: 'Aacrit',
  // Audit #5 — SEO surface. Robots, OpenGraph, Twitter card so the app
  // is discoverable by search engines and previewable on every share.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Sādhanā — Hindustani classical music practice',
    description:
      'A music physics engine for Hindustani classical music. Tanpura drone, real-time pitch feedback against 22 shrutis, raga-aware practice.',
    url: SITE_URL,
    siteName: 'Sādhanā',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: '/sadhana/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Sādhanā — Hindustani classical music practice app',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sādhanā — Hindustani classical music practice',
    description:
      'Tanpura drone, real-time pitch feedback against 22 shrutis, raga-aware practice. Free, no ads, no recordings.',
    images: ['/sadhana/og-image.svg'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: 'music education',
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
