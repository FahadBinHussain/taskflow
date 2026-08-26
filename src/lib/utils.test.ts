import { describe, it, expect } from "vitest";
import { getInitials, isOverdue, formatDueDate, relativeTime, daysFromToday } from "@/lib/utils";

describe("getInitials", () => {
  it("takes first letters of first two words", () => {
    expect(getInitials("Fahad Bin Hussain")).toBe("FB");
  });

  it("handles a single name", () => {
    expect(getInitials("mohsen")).toBe("M");
  });

  it("returns ? for an empty name", () => {
    expect(getInitials("")).toBe("?");
  });
});

describe("isOverdue", () => {
  it("flags a past due date as overdue", () => {
    expect(isOverdue("2000-01-01", "todo")).toBe(true);
  });

  it("never flags completed tasks", () => {
    expect(isOverdue("2000-01-01", "done")).toBe(false);
  });

  it("does not flag a far-future date", () => {
    expect(isOverdue("2999-12-31", "todo")).toBe(false);
  });
});

describe("formatDueDate", () => {
  it("shows Done for completed tasks", () => {
    expect(formatDueDate("2000-01-01", "done")).toEqual({ label: "Done", tone: "green" });
  });

  it("shows danger tone when late", () => {
    const { tone } = formatDueDate("2000-01-01", "todo");
    expect(tone).toBe("danger");
  });

  it("shows Today for today's date", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(formatDueDate(today, "todo")).toEqual({ label: "Today", tone: "accent" });
  });
});

describe("relativeTime", () => {
  it("says Just now for recent timestamps", () => {
    expect(relativeTime(new Date().toISOString())).toBe("Just now");
  });

  it("says Just now for empty input", () => {
    expect(relativeTime("")).toBe("Just now");
  });
});

describe("daysFromToday", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(daysFromToday(1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
