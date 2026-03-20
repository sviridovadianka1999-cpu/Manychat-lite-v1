import { env } from "@/src/config/env";

export default function SettingsPage() {
  return <div className="card space-y-2"><h2 className="text-xl font-semibold">Settings</h2><p>Meta flow: Instagram Graph API Webhooks + Messages API.</p><p>Public webhook URL: {env.PUBLIC_WEBHOOK_BASE_URL}/api/meta/webhook</p><p className="text-amber-700">Warning: designed for local run via TUNA tunnel.</p><pre>{JSON.stringify({ APP_BASE_URL: env.APP_BASE_URL, PUBLIC_WEBHOOK_BASE_URL: env.PUBLIC_WEBHOOK_BASE_URL, META_GRAPH_VERSION: env.META_GRAPH_VERSION }, null, 2)}</pre></div>;
}
