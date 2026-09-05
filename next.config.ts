import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Sin esto, Turbopack sube buscando un lockfile y puede acabar tomando el
  // directorio personal del usuario como raíz del proyecto.
  turbopack: {
    root: path.resolve(process.cwd()),
  },

  // Cabeceras de seguridad para toda la aplicación (regla 42).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            // La cámara se usa a través del selector de archivos del sistema
            // (input capture), no de getUserMedia, así que no hace falta.
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
