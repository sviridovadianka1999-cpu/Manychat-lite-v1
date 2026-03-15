import { describe, expect, test, vi } from "vitest";
import { seedDemoFlow } from "@/scripts/seed";

describe("seed idempotency", () => {
  test("updates existing flow and does not insert duplicate", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 });

    const result = await seedDemoFlow({ query } as any);

    expect(result).toBe("updated");
    expect(query).toHaveBeenCalledTimes(1);
    expect(String(query.mock.calls[0][0])).toContain("UPDATE flows");
  });

  test("inserts flow when missing", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 1 });

    const result = await seedDemoFlow({ query } as any);

    expect(result).toBe("inserted");
    expect(query).toHaveBeenCalledTimes(2);
    expect(String(query.mock.calls[1][0])).toContain("INSERT INTO flows");
  });
});
