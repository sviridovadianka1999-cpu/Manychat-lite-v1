import { beforeEach, describe, expect, test, vi } from "vitest";

const deduplicateEvent = vi.fn();
const listEnabledFlows = vi.fn();
const upsertContact = vi.fn();
const query = vi.fn();
const startExecution = vi.fn();

vi.mock("@/src/db/repositories", () => ({
  deduplicateEvent,
  listEnabledFlows,
  upsertContact
}));

vi.mock("@/src/db/client", () => ({ query }));
vi.mock("@/src/flows/engine", () => ({ startExecution }));

describe("webhook handler smoke", () => {
  beforeEach(() => {
    deduplicateEvent.mockReset();
    listEnabledFlows.mockReset();
    upsertContact.mockReset();
    query.mockReset();
    startExecution.mockReset();
  });

  test("processes supported event and starts matching flow", async () => {
    deduplicateEvent.mockResolvedValue(true);
    upsertContact.mockResolvedValue("contact-1");
    listEnabledFlows.mockResolvedValue({
      rows: [
        {
          id: "flow-1",
          definition_json: { trigger: { type: "instagram_comment_any", config: {} }, nodes: [], edges: [] }
        }
      ]
    });
    query.mockResolvedValue({ rowCount: 1, rows: [] });

    const { handleMetaWebhook } = await import("@/src/meta/webhook-handler");

    await handleMetaWebhook({
      object: "instagram",
      entry: [
        {
          id: "178414",
          changes: [
            {
              field: "comments",
              value: { id: "c1", text: "hello", from: { id: "u1" } }
            }
          ]
        }
      ]
    } as any);

    expect(deduplicateEvent).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledTimes(1);
    expect(startExecution).toHaveBeenCalledTimes(1);
  });
});
