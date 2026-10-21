/** Fuseau Africa/Kinshasa (UTC+1, pas de DST). */
const KINSHASA_OFFSET_MS = 60 * 60 * 1000;

export function toKinshasaDateKey(date: Date = new Date()): string {
  const local = new Date(date.getTime() + KINSHASA_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function kinshasaTimeString(date: Date = new Date()): string {
  const local = new Date(date.getTime() + KINSHASA_OFFSET_MS);
  const h = String(local.getUTCHours()).padStart(2, '0');
  const min = String(local.getUTCMinutes()).padStart(2, '0');
  const s = String(local.getUTCSeconds()).padStart(2, '0');
  return `${h}:${min}:${s}`;
}

export function startOfKinshasaDayUtc(date: Date = new Date()): Date {
  const key = toKinshasaDateKey(date);
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 0, 0, 0) - KINSHASA_OFFSET_MS);
}
