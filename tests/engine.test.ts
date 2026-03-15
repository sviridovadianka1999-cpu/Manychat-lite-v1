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

  test("backward compatibility: keyword -> keywords[]", () => {
    expect(
      matchTrigger(
        "instagram_comment_contains_keyword",
        { keyword: "НСК" },
        "instagram_comment",
        "Ищу НСК"
      )
    ).toBe(true);
  });

  test("keyword match mode: contains", () => {
    expect(
      matchTrigger(
        "instagram_comment_contains_keyword",
        { keywords: ["НСК"], matchMode: "contains", caseInsensitive: true },
        "instagram_comment",
        "Хочу НСК тусовку"
      )
    ).toBe(true);
  });

  test("keyword match mode: equals", () => {
    expect(
      matchTrigger(
        "instagram_comment_contains_keyword",
        { keywords: ["нск"], matchMode: "equals", caseInsensitive: true },
        "instagram_comment",
        "НСК"
      )
    ).toBe(true);
  });

  test("keyword match mode: starts_with", () => {
    expect(
      matchTrigger(
        "instagram_comment_contains_keyword",
        { keywords: ["нск"], matchMode: "starts_with", caseInsensitive: true },
        "instagram_comment",
        "НСК куда пойти"
      )
    ).toBe(true);
  });

  test("keyword case-insensitive toggle", () => {
    expect(
      matchTrigger(
        "instagram_comment_contains_keyword",
        { keywords: ["нск"], matchMode: "contains", caseInsensitive: false },
        "instagram_comment",
        "НСК"
      )
    ).toBe(false);
  });
});
