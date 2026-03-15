import { describe, expect, test } from "vitest";
import { conditionContactHasTag, dedupInMemory, keywordMatch, scheduleAt } from "@/src/flows/runtime";
import { matchTrigger } from "@/src/flows/matcher";

describe("flow engine helpers", () => {
  test("keyword matching", () => {
    expect(keywordMatch("НСК привет", "нск")).toBe(true);
  });

  test("event deduplication", () => {
    const set = new Set<string>();
    expect(dedupInMemory(set, "a")).toBe(true);
    expect(dedupInMemory(set, "a")).toBe(false);
  });

  test("flow execution happy path trigger", () => {
    expect(matchTrigger("instagram_dm_any", {}, "instagram_dm", "hello")).toBe(true);
  });

  test("wait scheduling", () => {
    const dt = scheduleAt(5, new Date("2024-01-01T00:00:00.000Z"));
    expect(dt.toISOString()).toBe("2024-01-01T00:00:05.000Z");
  });

  test("contact_has_tag condition", () => {
    expect(conditionContactHasTag(["nsk_interest"], "nsk_interest")).toBe(true);
  });
});
