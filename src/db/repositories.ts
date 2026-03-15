import { query } from "@/src/db/client";
import { FlowDefinition } from "@/src/types/flow";

export async function upsertContact(platformUserId: string, username?: string, displayName?: string) {
  const result = await query<{ id: string }>(
    `INSERT INTO contacts (platform, platform_user_id, username, display_name)
     VALUES ('instagram', $1, $2, $3)
     ON CONFLICT (platform, platform_user_id)
     DO UPDATE SET username = COALESCE(EXCLUDED.username, contacts.username),
                   display_name = COALESCE(EXCLUDED.display_name, contacts.display_name),
                   updated_at = now()
     RETURNING id`,
    [platformUserId, username ?? null, displayName ?? null]
  );
  return result.rows[0]?.id;
}

export async function deduplicateEvent(eventKey: string) {
  const result = await query(`INSERT INTO processed_event_keys (event_key) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id`, [eventKey]);
  return result.rowCount === 1;
}

export async function listEnabledFlows() {
  return query<{ id: string; definition_json: FlowDefinition }>(`SELECT id, definition_json FROM flows WHERE is_enabled = true`);
}

export async function addTag(contactId: string, tag: string) {
  await query(`INSERT INTO contact_tags (contact_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [contactId, tag]);
}

export async function removeTag(contactId: string, tag: string) {
  await query(`DELETE FROM contact_tags WHERE contact_id = $1 AND tag = $2`, [contactId, tag]);
}

export async function setCustomField(contactId: string, fieldKey: string, fieldValue: string) {
  await query(
    `INSERT INTO contact_custom_fields (contact_id, field_key, field_value)
     VALUES ($1, $2, $3)
     ON CONFLICT (contact_id, field_key)
     DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = now()`,
    [contactId, fieldKey, fieldValue]
  );
}
