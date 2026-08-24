import type { FileAttachment } from '../types';
import { getApiBaseUrl, isApiEnabled } from './client';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('No se pudo leer el archivo'));
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(blob);
  });
}

async function resolveDataUrl(file: FileAttachment): Promise<string | null> {
  const url = file.dataUrl || '';
  if (url.startsWith('data:') && url.length > 64) return url;
  if (url.startsWith('blob:')) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return blobToDataUrl(blob);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Sube una evidencia al servidor y devuelve el adjunto con URL /api/evidence/...
 * Así el sync ya no manda data: vacíos y Carlos puede ver el archivo.
 */
export async function uploadEvidenceAttachment(
  file: FileAttachment,
): Promise<{ ok: true; file: FileAttachment } | { ok: false; error: string }> {
  if (!isApiEnabled()) {
    return { ok: false, error: 'API no disponible para subir evidencias' };
  }
  const existing = file.dataUrl || '';
  if (
    existing.startsWith('/api/evidence/') ||
    existing.startsWith('/evidence/') ||
    existing.startsWith('http://') ||
    existing.startsWith('https://')
  ) {
    return { ok: true, file: { ...file, blobStored: false } };
  }

  const dataUrl = await resolveDataUrl(file);
  if (!dataUrl) {
    return {
      ok: false,
      error: `No se pudo leer «${file.name}» para subirlo al servidor`,
    };
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        dataUrl,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      url?: string;
      error?: string;
      size?: number;
      mimeType?: string;
    };
    if (!res.ok || !data.url) {
      return {
        ok: false,
        error: data.error || `No se pudo subir «${file.name}»`,
      };
    }
    return {
      ok: true,
      file: {
        ...file,
        dataUrl: data.url,
        mimeType: data.mimeType || file.mimeType,
        size: data.size || file.size,
        blobStored: false,
      },
    };
  } catch {
    return { ok: false, error: `Error de red al subir «${file.name}»` };
  }
}

export async function uploadEvidenceAttachments(
  files: FileAttachment[],
): Promise<{ ok: true; files: FileAttachment[] } | { ok: false; error: string }> {
  const out: FileAttachment[] = [];
  for (const file of files) {
    const result = await uploadEvidenceAttachment(file);
    if (!result.ok) return result;
    out.push(result.file);
  }
  return { ok: true, files: out };
}
