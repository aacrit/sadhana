import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // GitHub Pages serves at /sadhana/ — basePath + assetPrefix required
  basePath: isProd ? '/sadhana' : '',
  assetPrefix: isProd ? '/sadhana' : '',
  webpack: (config) => {
    // WASM support for RNNoise
    config.experiments = { ...config.experiments, asyncWebAssembly: true }
    // AudioWorklet support
    config.output = { ...config.output, globalObject: 'globalThis' }
    return config
  },
}

export default nextConfig
