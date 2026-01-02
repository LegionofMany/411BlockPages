export async function notifyAdmin(message: string, payload?: any) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;
  try {
    const body = {
      text: message,
      attachments: payload ? [{ text: JSON.stringify(payload, null, 2) }] : undefined,
    };
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('notifyAdmin failed', err);
  }
}
