import { beforeEach, describe, expect, test, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("@/src/db/client", () => ({
  query: queryMock
}));

vi.mock("@/src/db/repositories", () => ({
  addTag: vi.fn(),
  removeTag: vi.fn(),
  setCustomField: vi.fn()
}));

vi.mock("@/src/meta/service", () => ({
  sendCommentReply: vi.fn(async () => ({ success: true, data: { id: "1" } })),
  sendDm: vi.fn(async () => ({ success: true, data: { id: "1" } }))
}));

describe("engine critical behavior", () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [], rowCount: 1 });
  });

  test("stop_flow halts traversal", async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("RETURNING id")) return { rows: [{ id: "exec-1" }], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    });

    const { startExecution } = await import("@/src/flows/engine");

    const flow = {
      trigger: { type: "instagram_dm_any", config: {} },
      nodes: [
        { id: "t", type: "trigger" },
        { id: "stop", type: "action", config: { type: "stop_flow" } },
        { id: "after", type: "action", config: { type: "log_message", message: "should not run" } },
        { id: "end", type: "end" }
      ],
      edges: [
        { from: "t", to: "stop" },
        { from: "stop", to: "after" },
        { from: "after", to: "end" }
      ]
    };

    await startExecution("flow-1", flow as any, "contact-1", { eventKey: "k1", raw: {} }, "instagram_dm_any");

    const stepInsertCalls = queryMock.mock.calls
      .filter((call) => String(call[0]).includes("INSERT INTO flow_execution_steps"))
      .map((call) => call[1]?.[1]);

    expect(stepInsertCalls).toContain("stop");
    expect(stepInsertCalls).not.toContain("after");
  });

  test("flow_not_completed_before is scoped to current flow", async () => {
    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      if (sql.includes("RETURNING id")) return { rows: [{ id: "exec-2" }], rowCount: 1 };
      if (sql.includes("SELECT count(*) FROM flow_executions WHERE contact_id=$1 AND flow_id=$2")) {
        expect(values).toEqual(["contact-1", "flow-current"]);
        return { rows: [{ count: "0" }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    });

    const { startExecution } = await import("@/src/flows/engine");

    const flow = {
      trigger: { type: "instagram_dm_any", config: {} },
      nodes: [
        { id: "t", type: "trigger" },
        { id: "c1", type: "condition", config: { type: "flow_not_completed_before" } },
        { id: "end", type: "end" }
      ],
      edges: [
        { from: "t", to: "c1" },
        { from: "c1", to: "end", label: "true" }
      ]
    };

    await startExecution("flow-current", flow as any, "contact-1", { eventKey: "k2", raw: {} }, "instagram_dm_any");
  });
});
