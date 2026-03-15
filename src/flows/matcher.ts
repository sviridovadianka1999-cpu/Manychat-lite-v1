import { FlowDefinition, TriggerType } from "@/src/types/flow";

type MatchMode = "contains" | "equals" | "starts_with";

function normalizeKeywords(config: Record<string, unknown> | undefined) {
  const rawKeywords = Array.isArray(config?.keywords)
    ? config?.keywords
    : typeof config?.keyword === "string"
      ? [config.keyword]
      : [];

  return rawKeywords
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
}

function matchByMode(text: string, keyword: string, mode: MatchMode) {
  if (mode === "equals") return text === keyword;
  if (mode === "starts_with") return text.startsWith(keyword);
  return text.includes(keyword);
}

function matchKeywordConfig(config: Record<string, unknown> | undefined, text?: string) {
  if (typeof text !== "string") return false;

  const keywords = normalizeKeywords(config);
  if (keywords.length === 0) return false;

  const matchMode = config?.matchMode === "equals" || config?.matchMode === "starts_with" ? config.matchMode : "contains";
  const caseInsensitive = config?.caseInsensitive !== false;

  const sourceText = caseInsensitive ? text.toLowerCase() : text;
  return keywords.some((keyword) => {
    const target = caseInsensitive ? keyword.toLowerCase() : keyword;
    return matchByMode(sourceText, target, matchMode);
  });
}

export function matchTrigger(triggerType: TriggerType, config: Record<string, unknown> | undefined, eventType: string, text?: string) {
  if (triggerType === "instagram_comment_any") return eventType === "instagram_comment";
  if (triggerType === "instagram_dm_any") return eventType === "instagram_dm";
  if (triggerType === "instagram_story_reply") return eventType === "instagram_story_reply";
  if (triggerType === "instagram_comment_contains_keyword") {
    return eventType === "instagram_comment" && matchKeywordConfig(config, text);
  }
  if (triggerType === "instagram_dm_contains_keyword") {
    return eventType === "instagram_dm" && matchKeywordConfig(config, text);
  }
  return false;
}

export function getNextNode(def: FlowDefinition, nodeId: string, label?: string) {
  return def.edges.find((e) => e.from === nodeId && (!label || e.label === label))?.to;
}
