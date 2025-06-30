import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para Vercel
  output: 'standalone',
  
  // Configuración de imágenes
  images: {
    domains: ['localhost'],
    unoptimized: false,
  },
  
  // Configuración para archivos grandes
  experimental: {
    // Configuración para React 19
    reactCompiler: false,
  },
  
  // Configuración de seguridad
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Configuración de paquetes externos del servidor
  serverExternalPackages: ['@google/generative-ai'],
  
  // Configuración de webpack para optimizar el bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Configuración de ESLint para deployment
  eslint: {
    ignoreDuringBuilds: true, // Ignorar errores de ESLint durante el build para deployment
  },
  
  // Configuración de TypeScript
  typescript: {
    ignoreBuildErrors: true, // Ignorar errores de TypeScript durante el build para deployment
  },
};

export default nextConfig;
