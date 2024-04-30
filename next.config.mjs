/** @type {import('next').NextConfig} */
import a from 'url'
import b from 'node:url'

const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback.fs = false
        config.resolve.fallback.tls = false
        config.resolve.fallback.net = false
        config.resolve.fallback.child_process = false
        config.resolve.fallback.url = 'node:url'
    }

    return config
  },      
};

export default nextConfig;
