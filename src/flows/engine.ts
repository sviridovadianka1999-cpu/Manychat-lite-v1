import { query } from "@/src/db/client";
import { addTag, removeTag, setCustomField } from "@/src/db/repositories";
import { getNextNode } from "@/src/flows/matcher";
import { logger } from "@/src/logger";
import { sendDm, sendPrivateReply } from "@/src/meta/service";
import { ExecutionContext, FlowDefinition } from "@/src/types/flow";

export async function startExecution(flowId: string, definition: FlowDefinition, contactId: string | null, context: ExecutionContext, triggerType: string) {
  const execution = await query<{ id: string }>(
    `INSERT INTO flow_executions (flow_id, contact_id, status, trigger_type, context_json)
     VALUES ($1, $2, 'running', $3, $4) RETURNING id`,
    [flowId, contactId, triggerType, JSON.stringify(context)]
  );
  const executionId = execution.rows[0].id;
  const triggerNode = definition.nodes.find((n) => n.type === "trigger");
  if (!triggerNode) return executionId;
  const next = getNextNode(definition, triggerNode.id);
  if (next) await runNode(executionId, definition, next, contactId, context);
  return executionId;
}

export async function resumeWaitingExecutions() {
  const steps = await query<{ execution_id: string; node_id: string; context_json: ExecutionContext; flow_id: string; definition_json: FlowDefinition; contact_id: string | null }>(
    `SELECT s.execution_id, s.node_id, e.context_json, e.flow_id, f.definition_json, e.contact_id
       FROM flow_execution_steps s
       JOIN flow_executions e ON e.id = s.execution_id
       JOIN flows f ON f.id = e.flow_id
      WHERE s.status = 'waiting' AND s.scheduled_at <= now()`
  );

  for (const step of steps.rows) {
    await query(`UPDATE flow_execution_steps SET status='done', executed_at=now() WHERE execution_id=$1 AND node_id=$2 AND status='waiting'`, [step.execution_id, step.node_id]);
    const next = getNextNode(step.definition_json, step.node_id);
    if (next) await runNode(step.execution_id, step.definition_json, next, step.contact_id, step.context_json);
  }
}

async function runNode(executionId: string, definition: FlowDefinition, nodeId: string, contactId: string | null, context: ExecutionContext) {
  const node = definition.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  await query(`INSERT INTO flow_execution_steps (execution_id, node_id, node_type, status, executed_at) VALUES ($1, $2, $3, 'running', now())`, [executionId, nodeId, node.type]);

  try {
    if (node.type === "end") {
      await query(`UPDATE flow_executions SET status='completed', finished_at=now() WHERE id=$1`, [executionId]);
      await query(`UPDATE flow_execution_steps SET status='done' WHERE execution_id=$1 AND node_id=$2`, [executionId, nodeId]);
      return;
    }

    if (node.type === "condition") {
      const ok = await evalCondition(node.config ?? {}, contactId, context, executionId);
      const next = getNextNode(definition, nodeId, ok ? "true" : "false") ?? getNextNode(definition, nodeId);
      await query(`UPDATE flow_execution_steps SET status='done' WHERE execution_id=$1 AND node_id=$2`, [executionId, nodeId]);
      if (next) await runNode(executionId, definition, next, contactId, context);
      return;
    }

    if (node.type === "action") {
      await execAction(node.config ?? {}, contactId, context, executionId);
      const next = getNextNode(definition, nodeId);
      const stepStatus = (node.config?.type === "wait") ? "waiting" : "done";
      await query(`UPDATE flow_execution_steps SET status=$3 WHERE execution_id=$1 AND node_id=$2`, [executionId, nodeId, stepStatus]);
      if (node.config?.type === "wait") {
        await query(
          `UPDATE flow_execution_steps SET scheduled_at = now() + (($3 || ' seconds')::interval), status='waiting' WHERE execution_id=$1 AND node_id=$2`,
          [executionId, nodeId, String(node.config?.seconds ?? 5)]
        );
        await query(`UPDATE flow_executions SET status='waiting' WHERE id=$1`, [executionId]);
        return;
      }
      if (next) await runNode(executionId, definition, next, contactId, context);
      return;
    }

    const next = getNextNode(definition, nodeId);
    await query(`UPDATE flow_execution_steps SET status='done' WHERE execution_id=$1 AND node_id=$2`, [executionId, nodeId]);
    if (next) await runNode(executionId, definition, next, contactId, context);
  } catch (error) {
    logger.error("node execution failed", error);
    await query(`UPDATE flow_executions SET status='failed', finished_at=now(), error_text=$2 WHERE id=$1`, [executionId, String(error)]);
    await query(`UPDATE flow_execution_steps SET status='failed', error_text=$3 WHERE execution_id=$1 AND node_id=$2`, [executionId, nodeId, String(error)]);
  }
}

async function evalCondition(config: Record<string, unknown>, contactId: string | null, context: ExecutionContext, executionId: string) {
  const type = String(config.type ?? "");
  const value = String(config.value ?? "");
  const text = context.text ?? "";
  if (type === "text_contains") return text.includes(value);
  if (type === "text_equals") return text === value;
  if (type === "text_starts_with") return text.startsWith(value);
  if (type === "source_media_equals") return (context.sourceMedia ?? "") === value;
  if (type === "flow_not_completed_before" && contactId) {
    const r = await query<{ count: string }>(`SELECT count(*) FROM flow_executions WHERE contact_id=$1 AND status='completed'`, [contactId]);
    return Number(r.rows[0]?.count ?? 0) === 0;
  }
  if ((type === "contact_has_tag" || type === "contact_not_has_tag") && contactId) {
    const r = await query<{ count: string }>(`SELECT count(*) FROM contact_tags WHERE contact_id=$1 AND tag=$2`, [contactId, value]);
    const has = Number(r.rows[0]?.count ?? 0) > 0;
    return type === "contact_has_tag" ? has : !has;
  }
  if ((type === "custom_field_equals" || type === "custom_field_exists") && contactId) {
    const r = await query<{ field_value: string | null }>(`SELECT field_value FROM contact_custom_fields WHERE contact_id=$1 AND field_key=$2`, [contactId, String(config.field_key ?? "")]);
    if (type === "custom_field_exists") return r.rowCount > 0;
    return (r.rows[0]?.field_value ?? "") === value;
  }
  await query(`INSERT INTO flow_execution_steps (execution_id, node_id, node_type, status, debug_payload_json) VALUES ($1,'condition-debug','condition','done',$2)`, [executionId, JSON.stringify({ fallback: true, config })]);
  return false;
}

async function execAction(config: Record<string, unknown>, contactId: string | null, context: ExecutionContext, executionId: string) {
  const type = String(config.type ?? "");
  if (type === "send_private_reply" && context.commentId) {
    const result = await sendPrivateReply(context.commentId, String(config.text ?? ""));
    await saveOutgoing(contactId, type, config, result);
    return;
  }
  if (type === "send_dm" && context.platformUserId) {
    const result = await sendDm(context.platformUserId, String(config.text ?? ""));
    await saveOutgoing(contactId, type, config, result);
    return;
  }
  if (type === "add_tag" && contactId) return addTag(contactId, String(config.tag ?? ""));
  if (type === "remove_tag" && contactId) return removeTag(contactId, String(config.tag ?? ""));
  if (type === "set_custom_field" && contactId) return setCustomField(contactId, String(config.field_key ?? ""), String(config.field_value ?? ""));
  if (type === "stop_flow") {
    await query(`UPDATE flow_executions SET status='stopped', finished_at=now() WHERE id=$1`, [executionId]);
    return;
  }
  if (type === "call_external_webhook") {
    await fetch(String(config.url), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ executionId, context }) });
    return;
  }
  if (type === "log_message") {
    logger.info(`Flow log: ${String(config.message ?? "")}`);
    return;
  }
}

async function saveOutgoing(contactId: string | null, type: string, payload: Record<string, unknown>, result: unknown) {
  const success = typeof result === "object" && result !== null && "success" in result && (result as { success: boolean }).success;
  await query(
    `INSERT INTO outgoing_messages (platform, contact_id, message_type, payload_json, send_status, error_text, sent_at)
    VALUES ('instagram',$1,$2,$3,$4,$5,$6)`,
    [contactId, type, JSON.stringify(payload), success ? "sent" : "failed", success ? null : JSON.stringify(result), success ? new Date().toISOString() : null]
  );
}
