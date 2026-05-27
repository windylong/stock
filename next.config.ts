import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.naver.com' },
      { protocol: 'https', hostname: '*.yonhapnews.co.kr' },
    ],
  },
}

export default nextConfig
