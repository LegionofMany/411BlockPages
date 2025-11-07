// Lightweight Sentry wrapper: optional dynamic import so Sentry is not a hard dependency.
let SENTRY_MODULE: unknown | null = null;

export async function initSentry(): Promise<void>{
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try{
    // dynamic import avoids hard dependency at build time
  // optional import - package may not be installed in all environments
  const mod = await import('@sentry/node');
    if (mod){
      const m = mod as unknown as { init?: (opts: Record<string, unknown>) => void };
      if (typeof m.init === 'function'){
        m.init({ dsn, environment: process.env.NODE_ENV || 'development' });
        SENTRY_MODULE = mod;
  console.info('[sentry] initialized');
      }
    }
    }catch(err){
    // ignore if not installed or fails to initialize
    console.warn('[sentry] not available', err instanceof Error ? err.message : String(err));
    SENTRY_MODULE = null;
  }
}

export function captureException(e: unknown): void{
  if (!SENTRY_MODULE) return;
  try{
    const mod = SENTRY_MODULE as { captureException?: (x: unknown) => void };
    if (typeof mod.captureException === 'function') mod.captureException(e);
  }catch{}
}

export function captureMessage(m: string): void{
  if (!SENTRY_MODULE) return;
  try{
    const mod = SENTRY_MODULE as { captureMessage?: (x: string) => void };
    if (typeof mod.captureMessage === 'function') mod.captureMessage(m);
  }catch{}
}

// Enrich Sentry scope with request/admin context when available.
export async function setRequestContext(req: { headers?: Record<string, unknown>; url?: string; method?: string } | undefined, extras?: Record<string, unknown>){
  if (!SENTRY_MODULE) return;
  try{
    const mod = SENTRY_MODULE as any;
    if (typeof mod.configureScope !== 'function') return;
    mod.configureScope((scope: any) => {
      try{
        if (req?.url) scope.setTag('url', String(req.url));
        if (req?.method) scope.setTag('method', String(req.method));
        const admin = req?.headers && (req.headers['x-admin-address'] || req.headers['x-admin-wallet']);
        if (admin) scope.setUser({ id: String(admin) });
        if (extras) scope.setContext('extras', extras);
      }catch(e){}
    });
  }catch(e){/* ignore */}
}

// Convenience wrapper to run a callback with a fresh Sentry scope (does not await init)
export async function withSentryScope<T = unknown>(req: { headers?: Record<string, unknown>; url?: string; method?: string } | undefined, cb: () => Promise<T>){
  if (!SENTRY_MODULE) return cb();
  try{
    const mod = SENTRY_MODULE as any;
    if (typeof mod.withScope === 'function'){
      return await mod.withScope(async (scope: any) => {
        try{
          if (req?.url) scope.setTag('url', String(req.url));
          if (req?.method) scope.setTag('method', String(req.method));
          const admin = req?.headers && (req.headers['x-admin-address'] || req.headers['x-admin-wallet']);
          if (admin) scope.setUser({ id: String(admin) });
          return await cb();
        }catch(err){
          throw err;
        }
      });
    }
  }catch(e){/* ignore */}
  return cb();
}

// Initialize without awaiting during module import (server-side only)
if (typeof window === 'undefined') void initSentry();

const sentry = { initSentry, captureException, captureMessage };
export default sentry;
