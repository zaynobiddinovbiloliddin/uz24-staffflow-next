// Simple in-memory TTL cache — single process, no Redis needed for MVP
interface Entry { value: unknown; expiresAt: number }

const G = globalThis as any;
if (!G.__appCache) G.__appCache = new Map<string, Entry>();
const store: Map<string, Entry> = G.__appCache;

/** Run fn, cache result for ttlMs. Concurrent callers share the same promise. */
export async function withCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  const value = await fn();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

/** Remove all cache entries whose key starts with prefix */
export function invalidateCache(prefix: string) {
  store.forEach((_, k) => { if (k.startsWith(prefix)) store.delete(k); });
}
