// BullMQ removed for serverless deployment; keep a safe stub to avoid build-time type errors.
export const pollerQueue = null as unknown as { add: (..._args: any[]) => Promise<void> };

export async function enqueueFundraiserPoll() {
  // no-op in serverless mode
  return Promise.resolve();
}
