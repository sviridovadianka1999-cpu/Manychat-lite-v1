import { revalidatePath } from "next/cache";
import { query } from "@/src/db/client";

function normalizeKeywords(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export default async function FlowDetail({ params }: { params: { id: string } }) {
  const flowResult = await query<any>("SELECT * FROM flows WHERE id=$1", [params.id]);
  const flow = flowResult.rows[0];

  if (!flow) {
    return <div className="card">Flow not found.</div>;
  }

  const triggerConfig = (flow.definition_json?.trigger?.config ?? {}) as Record<string, unknown>;
  const keywords = Array.isArray(triggerConfig.keywords)
    ? triggerConfig.keywords.map((x) => String(x)).join("\n")
    : typeof triggerConfig.keyword === "string"
      ? String(triggerConfig.keyword)
      : "";
  const matchMode = ["contains", "equals", "starts_with"].includes(String(triggerConfig.matchMode))
    ? String(triggerConfig.matchMode)
    : "contains";
  const caseInsensitive = triggerConfig.caseInsensitive !== false;

  async function saveTriggerConfig(formData: FormData) {
    "use server";

    const row = await query<any>("SELECT definition_json FROM flows WHERE id=$1", [params.id]);
    const definition = row.rows[0]?.definition_json;
    if (!definition?.trigger) return;

    const nextKeywords = normalizeKeywords(String(formData.get("keywords") ?? ""));
    const nextMatchModeRaw = String(formData.get("matchMode") ?? "contains");
    const nextMatchMode = nextMatchModeRaw === "equals" || nextMatchModeRaw === "starts_with" ? nextMatchModeRaw : "contains";
    const nextCaseInsensitive = formData.get("caseInsensitive") === "on";

    definition.trigger.config = {
      ...(definition.trigger.config ?? {}),
      keywords: nextKeywords,
      matchMode: nextMatchMode,
      caseInsensitive: nextCaseInsensitive
    };

    if ("keyword" in definition.trigger.config) {
      delete definition.trigger.config.keyword;
    }

    await query("UPDATE flows SET definition_json=$2, updated_at=now() WHERE id=$1", [params.id, JSON.stringify(definition)]);
    revalidatePath(`/flows/${params.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold">Flow details</h2>
        <pre>{JSON.stringify(flow, null, 2)}</pre>
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Trigger config</h3>
        <p>keywords: {keywords ? keywords.split("\n").join(", ") : "(empty)"}</p>
        <p>matchMode: {matchMode}</p>
        <p>caseInsensitive: {String(caseInsensitive)}</p>

        <form action={saveTriggerConfig} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Keywords (one per line)</label>
            <textarea name="keywords" defaultValue={keywords} rows={5} className="w-full rounded border p-2" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Match mode</label>
            <select name="matchMode" defaultValue={matchMode} className="rounded border p-2">
              <option value="contains">contains</option>
              <option value="equals">equals</option>
              <option value="starts_with">starts_with</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="caseInsensitive" defaultChecked={caseInsensitive} />
            caseInsensitive
          </label>

          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">Save</button>
        </form>
      </div>
    </div>
  );
}
