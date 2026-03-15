#!/usr/bin/env bash
set -euo pipefail
URL="${1:-http://localhost:3000/api/meta/webhook}"
FILE="${2:-examples/sample-comment-webhook.json}"
curl -sS -X POST "$URL" -H 'Content-Type: application/json' --data "$(cat "$FILE")"
echo
