import AdminAction from './adminActionModel';
import sentry from './sentry';

/**
 * Record an admin action in the DB and report failures to Sentry.
 * This centralizes audit logging and avoids sprinkling try/catch everywhere.
 */
export async function recordAdminAction(opts: { admin?: string; action: string; target?: string; reason?: string }){
  try{
    const { admin, action, target, reason } = opts;
    await AdminAction.create({ admin: admin || 'unknown', action, target: target || '', reason: reason || '' });
  }catch(e){
    // Don't let audit failures break the main flow. Report to Sentry and warn.
    try{ sentry.captureException(e); }catch{};
    console.warn('[recordAdminAction] failed to persist audit', e instanceof Error ? e.message : String(e));
  }
}

export default recordAdminAction;
