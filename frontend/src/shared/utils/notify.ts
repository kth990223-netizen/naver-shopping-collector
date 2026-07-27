/**
 * Discord 웹훅 형식({ content: string })으로 메시지를 보낸다.
 * Slack 등 같은 형식을 쓰는 다른 웹훅에도 그대로 동작한다.
 */
export async function sendWebhookNotification(url: string, message: string): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  });

  if (!res.ok) throw new Error(`웹훅 전송 실패 (${res.status})`);
}
