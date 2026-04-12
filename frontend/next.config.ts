import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  webpack: (config) => {
    // WASM support for RNNoise
    config.experiments = { ...config.experiments, asyncWebAssembly: true }
    // AudioWorklet support
    config.output = { ...config.output, globalObject: 'globalThis' }
    return config
  },
}

export default nextConfig
