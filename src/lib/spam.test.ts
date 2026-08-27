import { describe, it, expect } from "vitest";
import { checkSpam } from "@/lib/utils";

describe("checkSpam", () => {
  it("flags earn-money spam", () => {
    const result = checkSpam("earn $$$ fast, free money!!! click here now");
    expect(result.isSpam).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(60);
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it("flags buy-followers spam", () => {
    const result = checkSpam("buy followers and likes, guaranteed profit!!!");
    expect(result.isSpam).toBe(true);
  });

  it("passes a normal standup task", () => {
    const result = checkSpam("sprint standup: review the deploy checklist for monday release");
    expect(result.isSpam).toBe(false);
  });

  it("passes short plain text", () => {
    const result = checkSpam("fix bug");
    expect(result.isSpam).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it("returns clean result for empty input", () => {
    expect(checkSpam("")).toEqual({ isSpam: false, confidence: 0, matches: [] });
  });
});
