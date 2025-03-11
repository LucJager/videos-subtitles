import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Permet de servir les fichiers statiques depuis le dossier public
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/static/:path*',
      },
    ]
  },
}

export default nextConfig
