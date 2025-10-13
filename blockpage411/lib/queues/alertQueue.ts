// Stub queue to keep tooling happy in serverless-only configuration.
const redisUrl = process.env.REDIS_URL;

export function isQueueAvailable(): boolean {
  return false;
}

export function getAlertQueue() {
  return null;
}

export async function enqueueAlert(_alertId: string) {
  // no-op in serverless mode
  void redisUrl;
  void _alertId;
  return;
}
