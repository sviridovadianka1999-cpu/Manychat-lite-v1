import { FlowDefinition, TriggerType } from "@/src/types/flow";

export function matchTrigger(triggerType: TriggerType, config: Record<string, unknown> | undefined, eventType: string, text?: string) {
  if (triggerType === "instagram_comment_any") return eventType === "instagram_comment";
  if (triggerType === "instagram_dm_any") return eventType === "instagram_dm";
  if (triggerType === "instagram_story_reply") return eventType === "instagram_story_reply";
  if (triggerType === "instagram_comment_contains_keyword") {
    return eventType === "instagram_comment" && typeof text === "string" && text.toLowerCase().includes(String(config?.keyword ?? "").toLowerCase());
  }
  if (triggerType === "instagram_dm_contains_keyword") {
    return eventType === "instagram_dm" && typeof text === "string" && text.toLowerCase().includes(String(config?.keyword ?? "").toLowerCase());
  }
  return false;
}

export function getNextNode(def: FlowDefinition, nodeId: string, label?: string) {
  return def.edges.find((e) => e.from === nodeId && (!label || e.label === label))?.to;
}
