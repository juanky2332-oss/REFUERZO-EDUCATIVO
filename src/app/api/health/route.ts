/**
 * Comprobación de estado. No revela claves ni configuración sensible: sólo si
 * hay proveedor configurado y cuál, para poder diagnosticar un despliegue.
 */

import { configuracion } from '@/lib/ai/provider';
import { hayProveedorCurriculo } from '@/lib/curriculum';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const cfg = configuracion();
  return Response.json({
    ok: true,
    ia: cfg
      ? { configurada: true, proveedor: cfg.proveedor, modelo: cfg.modeloPrincipal }
      : { configurada: false },
    curriculo: { proveedorDocumental: hayProveedorCurriculo() },
    version: process.env.npm_package_version ?? null,
  });
}
