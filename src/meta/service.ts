import { env } from "@/src/config/env";

type MetaResult = { success: true; data: unknown } | { success: false; error: string; details?: unknown };

async function callMeta(endpoint: string, payload: Record<string, unknown>): Promise<MetaResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.META_ACCESS_TOKEN}` },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: "meta_api_error", details: data };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "meta_network_error", details: String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendPrivateReply(igCommentId: string, message: string) {
  return callMeta(`${igCommentId}/replies`, { message });
}

export async function sendDm(igUserId: string, message: string) {
  return callMeta(`me/messages`, {
    recipient: { id: igUserId },
    message: { text: message },
    messaging_product: "instagram"
  });
}
