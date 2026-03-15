export type TriggerType =
  | "instagram_comment_contains_keyword"
  | "instagram_comment_any"
  | "instagram_dm_any"
  | "instagram_dm_contains_keyword"
  | "instagram_story_reply";

export type ConditionType =
  | "text_contains"
  | "text_equals"
  | "text_starts_with"
  | "contact_has_tag"
  | "contact_not_has_tag"
  | "custom_field_equals"
  | "custom_field_exists"
  | "source_media_equals"
  | "flow_not_completed_before";

export type ActionType =
  | "send_comment_reply"
  | "send_dm"
  | "add_tag"
  | "remove_tag"
  | "set_custom_field"
  | "wait"
  | "stop_flow"
  | "call_external_webhook"
  | "log_message";

export type FlowNode = {
  id: string;
  type: "trigger" | "condition" | "action" | "end";
  config?: Record<string, unknown>;
};

export type FlowEdge = {
  from: string;
  to: string;
  label?: string;
};

export type FlowDefinition = {
  trigger: { type: TriggerType; config?: Record<string, unknown> };
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export type ExecutionContext = {
  text?: string;
  sourceMedia?: string;
  sourceMediaId?: string;
  sourceMediaProductType?: string;
  sourceMediaRaw?: unknown;
  platformUserId?: string;
  commentId?: string;
  eventKey: string;
  raw: unknown;
};
