import { query } from "@/src/db/client";
import { deduplicateEvent, listEnabledFlows, upsertContact } from "@/src/db/repositories";
import { startExecution } from "@/src/flows/engine";
import { matchTrigger } from "@/src/flows/matcher";
import { logger } from "@/src/logger";
import { ExecutionContext } from "@/src/types/flow";
import { WebhookPayload } from "@/src/validators/meta-webhook";

export async function handleMetaWebhook(payload: WebhookPayload) {
  const events = normalizeEvents(payload);

  for (const event of events) {
    const eventKey = `${event.eventType}:${event.externalId}:${event.platformUserId}:${event.text}`;
    const ok = await deduplicateEvent(eventKey);
    if (!ok) continue;

    const contactId = event.platformUserId ? await upsertContact(event.platformUserId, event.username, event.displayName) : null;
    await query(
      `INSERT INTO incoming_events (platform, event_type, external_event_id, contact_id, payload_json)
       VALUES ('instagram',$1,$2,$3,$4)`,
      [event.eventType, event.externalId ?? null, contactId, JSON.stringify(event.raw)]
    );

    const flows = await listEnabledFlows();
    for (const flow of flows.rows) {
      if (
        matchTrigger(flow.definition_json.trigger.type, flow.definition_json.trigger.config, event.eventType, event.text, {
          sourceMediaId: event.sourceMediaId
        })
      ) {
        const context: ExecutionContext = {
          eventKey,
          text: event.text,
          sourceMedia: event.sourceMedia,
          sourceMediaId: event.sourceMediaId,
          sourceMediaProductType: event.sourceMediaProductType,
          sourceMediaRaw: event.sourceMediaRaw,
          platformUserId: event.platformUserId,
          commentId: event.commentId,
          raw: event.raw
        };
        await startExecution(flow.id, flow.definition_json, contactId, context, flow.definition_json.trigger.type);
      }
    }
  }
  logger.info("webhook processed", { total: events.length });
}

function normalizeEvents(payload: WebhookPayload) {
  const out: Array<{
    eventType: string;
    externalId?: string;
    platformUserId?: string;
    text?: string;
    sourceMedia?: string;
    sourceMediaId?: string;
    sourceMediaProductType?: string;
    sourceMediaRaw?: unknown;
    commentId?: string;
    username?: string;
    displayName?: string;
    raw: unknown;
  }> = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      if (change.field === "comments") {
        out.push({
          eventType: "instagram_comment",
          externalId: String(value.id ?? ""),
          platformUserId: String(value.from?.id ?? ""),
          text: String(value.text ?? ""),
          sourceMediaId: value.media?.id ? String(value.media.id) : undefined,
          sourceMediaProductType: value.media?.media_product_type ? String(value.media.media_product_type) : undefined,
          sourceMediaRaw: value.media ?? undefined,
          commentId: String(value.id ?? ""),
          raw: change
        });
      } else if (change.field === "messages") {
        out.push({
          eventType: String(value.item === "story_mention" ? "instagram_story_reply" : "instagram_dm"),
          externalId: String(value.mid ?? value.id ?? ""),
          platformUserId: String(value.from?.id ?? ""),
          text: String(value.text ?? ""),
          sourceMedia: String(value.item ?? ""),
          raw: change
        });
      }
    }
  }
  return out;
}
