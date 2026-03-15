# Manychat-lite v1 (Instagram, local-first)

Internal tool for one business: receive Meta webhook events, run JSON flows (trigger-condition-action), store contacts/executions in local PostgreSQL, and send messages via official Meta Graph API.

## Chosen Meta integration scheme
- **Official flow**: Instagram Graph API Webhooks (`comments`, `messages`) + Graph API messaging endpoints.
- Verification endpoint: `GET /api/meta/webhook` (`hub.mode`, `hub.verify_token`, `hub.challenge`).
- Event endpoint: `POST /api/meta/webhook`.

### Important naming note
- `send_comment_reply` uses `POST /{ig-comment-id}/replies` and creates a **public comment reply**.
- This project **does not claim** that `send_comment_reply` is an Instagram private DM reply.
- `send_dm` uses Graph API messaging (`POST /me/messages`, `messaging_product=instagram`) and requires proper Meta permissions/access mode.

## Local architecture (main scenario)
- Next.js app runs locally (`http://localhost:3000`).
- PostgreSQL runs locally (`localhost:5432`) and is **never exposed publicly**.
- TUNA publishes only HTTPS tunnel to local backend.
- Meta webhook callback URL points to TUNA URL and proxies into local app.

## v1 includes
- Trigger types: `instagram_comment_contains_keyword`, `instagram_comment_any`, `instagram_dm_any`, `instagram_dm_contains_keyword`, `instagram_story_reply`.
- Conditions: `text_contains`, `text_equals`, `text_starts_with`, `contact_has_tag`, `contact_not_has_tag`, `custom_field_equals`, `custom_field_exists`, `source_media_equals`, `flow_not_completed_before`.
- Actions: `send_comment_reply`, `send_dm`, `add_tag`, `remove_tag`, `set_custom_field`, `wait`, `stop_flow`, `call_external_webhook`, `log_message`.
- Built-in scheduler polling waiting steps.
- Admin UI for visibility/inspection: Dashboard, Flows, Contacts, Executions, Incoming Events, Outgoing Messages, Settings.

## Current admin UI scope (truthful)
- Implemented: list/detail/read views for entities and operational visibility.
- Not implemented in this v1 UI: full CRUD forms with toggle/delete controls.
- Flow editing is currently done by updating `definition_json` in DB (or seed/custom SQL), then viewing results in UI.

## Non-goals
No SaaS/multi-tenant/RBAC/billing/drag-and-drop/broadcasts/analytics/A-B/CRM/Telegram/WhatsApp/email/VPS/public DB/external queues.

## Setup
1. Install deps: `npm install`
2. Create DB `manychat_lite` in local PostgreSQL.
3. Create `.env` from `.env.example`.
4. Init schema: `npm run db:init`
5. Seed data: `npm run db:seed`
6. Run app: `npm run dev`
7. Health check: `GET /api/health`
8. Start TUNA tunnel to local `3000` and set Meta callback to:
   - `https://<tuna-domain>/api/meta/webhook`
9. Verify webhook using `META_VERIFY_TOKEN`.

## Local webhook test
```bash
./scripts/test-webhook.sh http://localhost:3000/api/meta/webhook examples/sample-comment-webhook.json
```

## What can be tested locally now
- Health endpoint.
- Webhook verification logic.
- Webhook ingestion + parsing + dedup + DB writes.
- Flow execution history.
- Wait step resume via built-in scheduler.
- Stop action halting execution.
- Admin UI data views.

## What requires Meta permissions/review/live mode
Real production send/receive for Instagram messaging/comment automation depends on app mode, linked assets, and permissions approved by Meta App Review / Advanced Access where required.

## Typical issues
- 403 on verification -> wrong `META_VERIFY_TOKEN`.
- No incoming real events -> wrong TUNA callback URL or webhook subscription fields.
- Outgoing failed -> invalid/expired `META_ACCESS_TOKEN`, wrong token type, or missing permissions.
