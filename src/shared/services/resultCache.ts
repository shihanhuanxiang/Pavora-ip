// 20 分鐘快取，key = JSON.stringify({imageHash, prompt, params})
type CacheEntry<T> = { data: T; expires: number };
const cache = new Map<string, CacheEntry<any>>();
const TTL = 20 * 60 * 1000;

export function getCache<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) { cache.delete(key); return null; }
  return hit.data as T;
}

export function setCache<T>(key: string, data: T) {
  cache.set(key, { data, expires: Date.now() + TTL });
}

export async function hashBytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function buildKey(obj: any) {
  // Sort keys for a stable JSON string
  const stableStringify = (o: any): string => {
    if (o === null || o === undefined) return JSON.stringify(o);
    if (typeof o !== 'object') return JSON.stringify(o);
    if (Array.isArray(o)) return `[${o.map(stableStringify).join(',')}]`;

    const keys = Object.keys(o).sort();
    const sortedEntries = keys.map(key => `${JSON.stringify(key)}:${stableStringify(o[key])}`);
    return `{${sortedEntries.join(',')}}`;
  };
  return stableStringify(obj);
}