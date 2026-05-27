import { RateLimitError } from './errors';

interface Record { count: number; resetAt: number; }

const store = new Map<string, Record>();

// Cleanup every 5 min — single instance per Node.js process
const G = globalThis as any;
if (!G.__rlCleanup) {
  G.__rlCleanup = setInterval(() => {
    const now = Date.now();
    store.forEach((r, k) => { if (r.resetAt <= now) store.delete(k); });
  }, 5 * 60_000);
}

export interface RateLimitConfig { windowMs: number; max: number; }

export function checkRateLimit(id: string, cfg: RateLimitConfig) {
  const now = Date.now();
  const rec = store.get(id);

  if (!rec || rec.resetAt <= now) {
    store.set(id, { count: 1, resetAt: now + cfg.windowMs });
    return { allowed: true, remaining: cfg.max - 1, resetAt: now + cfg.windowMs };
  }
  if (rec.count >= cfg.max) {
    const retryAfter = Math.ceil((rec.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetAt: rec.resetAt, retryAfter };
  }
  rec.count++;
  return { allowed: true, remaining: cfg.max - rec.count, resetAt: rec.resetAt };
}

export function getIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    req.headers.get('cf-connecting-ip') ??
    'unknown'
  );
}

// Preset configs
export const limits = {
  auth:  { windowMs: 15 * 60_000, max: 10  },  // 10 login attempts / 15 min
  read:  { windowMs: 60_000,       max: 120 },  // 120 reads / min
  write: { windowMs: 60_000,       max: 40  },  // 40 writes / min
};

/** Throws RateLimitError if over limit. Call at start of each route handler. */
export function applyRateLimit(req: Request, scope: keyof typeof limits | RateLimitConfig) {
  const cfg = typeof scope === 'string' ? limits[scope] : scope;
  const ip = getIP(req);
  const result = checkRateLimit(`${ip}:${req.url.replace(/\?.*/, '')}`, cfg);
  if (!result.allowed) throw new RateLimitError(result.retryAfter ?? 60);
}
