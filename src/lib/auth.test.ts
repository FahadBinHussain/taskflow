import { describe, it, expect } from "vitest";
import { signToken, verifyToken, hashPassword, comparePassword } from "@/lib/auth";
import { normalizeEmail } from "@/lib/email";

describe("signToken / verifyToken", () => {
  it("roundtrips the user id and role", () => {
    const token = signToken({ id: "user-1", role: "Member" });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.id).toBe("user-1");
    expect(payload?.role).toBe("Member");
  });

  it("returns null for a malformed token", () => {
    expect(verifyToken("not-a-token")).toBeNull();
  });

  it("returns null for an empty token", () => {
    expect(verifyToken("")).toBeNull();
  });
});

describe("hashPassword / comparePassword", () => {
  it("matches the original password", async () => {
    const hash = await hashPassword("taskflow123");
    expect(await comparePassword("taskflow123", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("taskflow123");
    expect(await comparePassword("wrong-pass", hash)).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });
});
