import fs from "node:fs";

const url = process.argv[2] ?? "http://localhost:3000/api/meta/webhook";
const file = process.argv[3] ?? "examples/sample-comment-webhook.json";

try {
  const payload = fs.readFileSync(file, "utf8");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload
  });

  const text = await response.text();
  console.log(`POST ${url}`);
  console.log(`Payload: ${file}`);
  console.log(`Status: ${response.status}`);
  console.log(text);
} catch (error) {
  console.error(`Webhook request failed: ${String(error)}`);
  console.error("Tip: start the app first with `npm run dev`.");
  process.exit(1);
}
