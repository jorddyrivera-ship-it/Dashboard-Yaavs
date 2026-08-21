import type { ProjectProgressUpdate } from '../types';
import { getApiBaseUrl, isApiEnabled } from './client';

/** Registra un avance directo en el servidor (sin esperar el sync completo). */
export async function postProjectProgress(
  projectId: string,
  update: ProjectProgressUpdate,
): Promise<{ ok: true; updatedAt?: string } | { ok: false; error: string }> {
  if (!isApiEnabled()) {
    return { ok: false, error: 'API no disponible' };
  }
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, update }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      updatedAt?: string;
      error?: string;
    };
    if (!res.ok || data.ok === false) {
      return {
        ok: false,
        error: data.error || 'No se pudo sincronizar el avance con el servidor',
      };
    }
    return { ok: true, updatedAt: data.updatedAt };
  } catch {
    return { ok: false, error: 'Error de red al guardar el avance' };
  }
}
