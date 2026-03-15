import { NextRequest, NextResponse } from "next/server";
import { env } from "@/src/config/env";
import { startScheduler } from "@/src/scheduler";
import { handleMetaWebhook } from "@/src/meta/webhook-handler";
import { webhookPayloadSchema } from "@/src/validators/meta-webhook";

startScheduler();

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = webhookPayloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await handleMetaWebhook(parsed.data);
  return NextResponse.json({ ok: true });
}
