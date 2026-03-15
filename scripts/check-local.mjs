const lines = [
  "Local smoke checklist (manual):",
  "1) npm install",
  "2) Copy .env.example -> .env and set real values",
  "3) npm run db:init",
  "4) npm run db:seed",
  "5) npm run dev",
  "6) curl http://localhost:3000/api/health",
  "7) npm run webhook:sample",
  "8) In PostgreSQL check: incoming_events, flow_executions, outgoing_messages"
];

console.log(lines.join("\n"));
