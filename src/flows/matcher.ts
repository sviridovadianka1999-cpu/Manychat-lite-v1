import { FlowDefinition, TriggerType } from "@/src/types/flow";

type MatchMode = "contains" | "equals" | "starts_with";

type TriggerMatchInput = {
  sourceMediaId?: string;
};

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

function normalizeAllowedMediaIds(config: Record<string, unknown> | undefined) {
  if (!Array.isArray(config?.allowedMediaIds)) return [];
  return config.allowedMediaIds
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0);
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

function matchCommentScope(config: Record<string, unknown> | undefined, input: TriggerMatchInput) {
  const scopeMode = config?.scopeMode === "specific_media" ? "specific_media" : "all";
  if (scopeMode === "all") return true;

  const allowedMediaIds = normalizeAllowedMediaIds(config);
  if (allowedMediaIds.length === 0) return false;
  if (!input.sourceMediaId) return false;

  return allowedMediaIds.includes(String(input.sourceMediaId));
}

export function matchTrigger(
  triggerType: TriggerType,
  config: Record<string, unknown> | undefined,
  eventType: string,
  text?: string,
  input: TriggerMatchInput = {}
) {
  if (triggerType === "instagram_comment_any") {
    return eventType === "instagram_comment" && matchCommentScope(config, input);
  }
  if (triggerType === "instagram_dm_any") return eventType === "instagram_dm";
  if (triggerType === "instagram_story_reply") return eventType === "instagram_story_reply";
  if (triggerType === "instagram_comment_contains_keyword") {
    return eventType === "instagram_comment" && matchCommentScope(config, input) && matchKeywordConfig(config, text);
  }
  if (triggerType === "instagram_dm_contains_keyword") {
    return eventType === "instagram_dm" && matchKeywordConfig(config, text);
  }
  return false;
}

export function getNextNode(def: FlowDefinition, nodeId: string, label?: string) {
  return def.edges.find((e) => e.from === nodeId && (!label || e.label === label))?.to;
}
