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

// Initialize without awaiting during module import (server-side only)
if (typeof window === 'undefined') void initSentry();

const sentry = { initSentry, captureException, captureMessage };
export default sentry;
