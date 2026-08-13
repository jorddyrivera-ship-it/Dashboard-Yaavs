import { clearAllAttachmentData } from './attachmentStore';
import {
  APP_CLIENT_VERSION,
  APP_CLIENT_VERSION_KEY,
  ASSIGNMENTS_STORAGE_KEY,
  CALENDAR_STORAGE_KEY,
  PASSWORD_OVERRIDES_KEY,
  TEAM_ROSTER_STORAGE_KEY,
  PERFORMANCE_HISTORY_KEY,
  SOCIAL_METRICS_KEY,
  USER_PROFILES_KEY,
  DAILY_KPI_SNAPSHOTS_KEY,
  KPI_OBJECTIVES_KEY,
  MONTHLY_ARCHIVES_KEY,
  EMPLOYEE_PHONES_KEY,
  ACTIVITY_FEED_KEY,
  STORAGE_KEY,
  VERSION_KEY,
} from '../constants';

const EXTRA_KEYS = [
  'yaavs-pwa-dismiss',
  'yaavs-pending-redirect',
  'yaavs-last-assignment-check',
  'yaavs-attachment-backup-v1',
];

export async function clearServiceWorkersAndCaches(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

/**
 * Si el build del cliente cambió, limpia la PWA/caché y recarga UNA vez.
 * No borra datos del tablero ni la sesión.
 * @returns true si ya disparó reload (no seguir iniciando la app).
 */
export async function ensureClientBuildFresh(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const current = localStorage.getItem(APP_CLIENT_VERSION_KEY);
    if (current === APP_CLIENT_VERSION) return false;

    const reloadFlag = `yaavs-build-reload-${APP_CLIENT_VERSION}`;
    if (sessionStorage.getItem(reloadFlag) === '1') {
      // Ya recargamos en esta sesión; marcar versión y continuar.
      localStorage.setItem(APP_CLIENT_VERSION_KEY, APP_CLIENT_VERSION);
      return false;
    }

    sessionStorage.setItem(reloadFlag, '1');
    localStorage.setItem(APP_CLIENT_VERSION_KEY, APP_CLIENT_VERSION);
    await clearServiceWorkersAndCaches();

    const url = new URL(window.location.href);
    url.searchParams.set('_yaavs', APP_CLIENT_VERSION);
    window.location.replace(url.toString());
    return true;
  } catch {
    return false;
  }
}

export function clearYaavsStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VERSION_KEY);
  localStorage.removeItem(ASSIGNMENTS_STORAGE_KEY);
  localStorage.removeItem(CALENDAR_STORAGE_KEY);
  localStorage.removeItem(PASSWORD_OVERRIDES_KEY);
  localStorage.removeItem(TEAM_ROSTER_STORAGE_KEY);
  localStorage.removeItem(PERFORMANCE_HISTORY_KEY);
  localStorage.removeItem(MONTHLY_ARCHIVES_KEY);
  localStorage.removeItem(KPI_OBJECTIVES_KEY);
  localStorage.removeItem(DAILY_KPI_SNAPSHOTS_KEY);
  localStorage.removeItem(SOCIAL_METRICS_KEY);
  localStorage.removeItem(USER_PROFILES_KEY);
  localStorage.removeItem(EMPLOYEE_PHONES_KEY);
  localStorage.removeItem(ACTIVITY_FEED_KEY);
  for (const key of EXTRA_KEYS) localStorage.removeItem(key);
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key.startsWith('yaavs-onboarding-') ||
      key.startsWith('empresa-board-') ||
      key.startsWith('yaavs-')
    ) {
      localStorage.removeItem(key);
    }
  }
  sessionStorage.clear();
}

export const FRESH_START_KEY = 'yaavs-fresh-start';

export async function resetAppAndReload(): Promise<void> {
  clearYaavsStorage();
  await clearAllAttachmentData().catch(() => undefined);
  await clearServiceWorkersAndCaches();
  sessionStorage.setItem(FRESH_START_KEY, '1');
  window.location.replace(window.location.origin);
}
