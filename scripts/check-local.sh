#!/usr/bin/env bash
set -euo pipefail

cat <<'TXT'
Local smoke checklist (manual):
1) npm install
2) cp .env.example .env  # set real values
3) npm run db:init
4) npm run db:seed
5) npm run dev
6) curl http://localhost:3000/api/health
7) ./scripts/test-webhook.sh http://localhost:3000/api/meta/webhook examples/sample-comment-webhook.json
8) In PostgreSQL check:
   - incoming_events
   - flow_executions
   - outgoing_messages
TXT
