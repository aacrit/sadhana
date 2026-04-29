import type { NextConfig } from 'next'

// Security headers are split between two surfaces because GitHub Pages
// (the current host) does not support custom response headers:
//   - CSP and X-Content-Type-Options are emitted via <meta http-equiv>
//     in app/layout.tsx — these are the only headers <meta> can carry.
//   - Strict-Transport-Security, Permissions-Policy, Referrer-Policy,
//     X-Frame-Options, and Cross-Origin-* live in frontend/public/_headers
//     for hosts that read it (Cloudflare Pages, Netlify, Vercel).
// When Sadhana migrates off GitHub Pages, the _headers file activates
// automatically with no code changes required.

const isProd = process.env.NODE_ENV === 'production'
const base = isProd ? '/sadhana' : ''

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // GitHub Pages serves at /sadhana/ — basePath + assetPrefix required
  basePath: base,
  assetPrefix: base,
  // Expose basePath to client-side code via NEXT_PUBLIC_BASE_PATH
  env: {
    NEXT_PUBLIC_BASE_PATH: base,
  },
  webpack: (config) => {
    // WASM support for RNNoise
    config.experiments = { ...config.experiments, asyncWebAssembly: true }
    // AudioWorklet support
    config.output = { ...config.output, globalObject: 'globalThis' }
    return config
  },
}

export default nextConfig
