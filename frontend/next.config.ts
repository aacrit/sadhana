import type { NextConfig } from 'next'

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
