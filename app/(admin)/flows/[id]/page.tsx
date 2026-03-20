import { revalidatePath } from "next/cache";
import { query } from "@/src/db/client";
import { resolveInstagramMediaLinks } from "@/src/meta/media-resolver";

function normalizeLines(input: string) {
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

  const triggerType = String(flow.definition_json?.trigger?.type ?? "");
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

  const scopeMode = triggerConfig.scopeMode === "specific_media" ? "specific_media" : "all";
  const allowedMediaLinks = Array.isArray(triggerConfig.allowedMediaLinks)
    ? triggerConfig.allowedMediaLinks.map((x) => String(x)).join("\n")
    : "";
  const allowedMediaIds = Array.isArray(triggerConfig.allowedMediaIds)
    ? triggerConfig.allowedMediaIds.map((x) => String(x))
    : [];
  const unresolvedMediaLinks = Array.isArray(triggerConfig.unresolvedMediaLinks)
    ? triggerConfig.unresolvedMediaLinks.map((x) => String(x))
    : [];
  const mediaResolveError = typeof triggerConfig.mediaResolveError === "string" ? triggerConfig.mediaResolveError : "";

  async function saveTriggerConfig(formData: FormData) {
    "use server";

    const row = await query<any>("SELECT definition_json FROM flows WHERE id=$1", [params.id]);
    const definition = row.rows[0]?.definition_json;
    if (!definition?.trigger) return;

    const nextKeywords = normalizeLines(String(formData.get("keywords") ?? ""));
    const nextMatchModeRaw = String(formData.get("matchMode") ?? "contains");
    const nextMatchMode = nextMatchModeRaw === "equals" || nextMatchModeRaw === "starts_with" ? nextMatchModeRaw : "contains";
    const nextCaseInsensitive = formData.get("caseInsensitive") === "on";

    const nextScopeMode = formData.get("scopeMode") === "specific_media" ? "specific_media" : "all";
    const nextLinks = normalizeLines(String(formData.get("allowedMediaLinks") ?? ""));

    let resolvedMediaIds: string[] = [];
    let unresolvedLinks: string[] = [];
    let resolveError: string | undefined;

    if (nextScopeMode === "specific_media") {
      const resolved = await resolveInstagramMediaLinks(nextLinks);
      resolvedMediaIds = resolved.resolvedMediaIds;
      unresolvedLinks = resolved.unresolvedLinks;
      resolveError = resolved.error;
    }

    definition.trigger.config = {
      ...(definition.trigger.config ?? {}),
      keywords: nextKeywords,
      matchMode: nextMatchMode,
      caseInsensitive: nextCaseInsensitive,
      scopeMode: nextScopeMode,
      allowedMediaLinks: nextLinks,
      allowedMediaIds: resolvedMediaIds,
      unresolvedMediaLinks: unresolvedLinks,
      mediaResolveError: resolveError
    };

    if ("keyword" in definition.trigger.config) {
      delete definition.trigger.config.keyword;
    }

    await query("UPDATE flows SET definition_json=$2, updated_at=now() WHERE id=$1", [params.id, JSON.stringify(definition)]);
    revalidatePath(`/flows/${params.id}`);
  }

  const isCommentTrigger = triggerType === "instagram_comment_any" || triggerType === "instagram_comment_contains_keyword";

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
        {isCommentTrigger && (
          <>
            <p>scopeMode: {scopeMode}</p>
            <p>allowedMediaIds: {allowedMediaIds.length > 0 ? allowedMediaIds.join(", ") : "(empty)"}</p>
            <p>allowedMediaLinks: {allowedMediaLinks ? allowedMediaLinks.split("\n").join(", ") : "(empty)"}</p>
            <p>unresolvedMediaLinks: {unresolvedMediaLinks.length > 0 ? unresolvedMediaLinks.join(", ") : "(none)"}</p>
            <p>mediaResolveError: {mediaResolveError || "(none)"}</p>
          </>
        )}

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

          {isCommentTrigger && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Scope mode</label>
                <select name="scopeMode" defaultValue={scopeMode} className="rounded border p-2">
                  <option value="all">all</option>
                  <option value="specific_media">specific_media</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Instagram links (one per line)</label>
                <textarea name="allowedMediaLinks" defaultValue={allowedMediaLinks} rows={5} className="w-full rounded border p-2" />
              </div>
            </>
          )}

          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">Save</button>
        </form>
      </div>
    </div>
  );
}
