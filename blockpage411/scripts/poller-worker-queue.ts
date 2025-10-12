// BullMQ worker removed — stub file retained for tooling compatibility.

export async function pollerWorkerStub() {
  // Serverless mode: use /api/poller/run instead of background workers.
  return Promise.resolve();
}
