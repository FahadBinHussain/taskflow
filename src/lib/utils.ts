import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isOverdue(dueDate: string, status?: string): boolean {
  if (status === "done") return false;
  if (!dueDate) return false;
  const target = new Date(dueDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target < today;
}

export function formatDueDate(dueDate: string, status?: string): { label: string; tone: "green" | "danger" | "warning" | "neutral" | "accent" } {
  if (status === "done") return { label: "Done", tone: "green" };
  if (!dueDate) return { label: "No date", tone: "neutral" };

  const d = new Date(dueDate);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const late = Math.abs(diffDays);
    return { label: `${late}d late`, tone: "danger" };
  }
  if (diffDays === 0) return { label: "Today", tone: "accent" };
  if (diffDays === 1) return { label: "Tomorrow", tone: "warning" };
  if (diffDays <= 7) return { label: `In ${diffDays}d`, tone: "neutral" };

  return {
    label: new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    tone: "neutral",
  };
}

export function relativeTime(isoString: string): string {
  if (!isoString) return "Just now";
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Spam Detection ──────────────────────────────────────────
const SPAM_PATTERNS = [
  { pattern: /earn\s*\$+\d*/i, weight: 35, label: "earn money promise" },
  { pattern: /make\s+money\s+fast/i, weight: 30, label: "make money fast" },
  { pattern: /click\s+here/i, weight: 20, label: "click here CTA" },
  { pattern: /\$\$\$/i, weight: 25, label: "dollar signs" },
  { pattern: /free\s+money/i, weight: 35, label: "free money" },
  { pattern: /work\s+from\s+home.*\$/i, weight: 30, label: "work from home scam" },
  { pattern: /verify\s+(your\s+)?account/i, weight: 20, label: "account verify" },
  { pattern: /confirm\s+(your\s+)?password/i, weight: 25, label: "password confirm" },
  { pattern: /bank\s+details/i, weight: 30, label: "bank details" },
  { pattern: /urgent.*action\s+required/i, weight: 25, label: "urgent action" },
  { pattern: /^[a-z]{8,20}(buy|sell|cheap|pills|meds)/i, weight: 40, label: "gibberish + commerce" },
  { pattern: /buy\s+(followers|likes|views|subscribers)/i, weight: 45, label: "buy engagement" },
  { pattern: /guaranteed\s+(income|profit|returns)/i, weight: 35, label: "guaranteed returns" },
  { pattern: /bit\.ly|tinyurl|t\.co\/[a-z0-9]{5,}/i, weight: 15, label: "short link" },
  { pattern: /http.*(?:\.ru|\.cn|\.tk|\.xyz)(?:\/|$)/i, weight: 30, label: "suspicious TLD" },
  { pattern: /!{3,}/g, weight: 15, label: "excessive exclamation" },
  { pattern: /\?{3,}/g, weight: 10, label: "excessive question marks" },
  { pattern: /\b[A-Z]{5,}\b/g, weight: 8, label: "all caps words" },
];

const TRUSTED_PATTERNS = [
  /meeting|standup|sprint|design|code review|bug|feature|deploy|test/i,
  /monday|tuesday|wednesday|thursday|friday/i,
  /update|refactor|document|review|merge|release/i,
];

export function checkSpam(text: string): { isSpam: boolean; confidence: number; matches: string[] } {
  if (!text || text.length < 5) return { isSpam: false, confidence: 0, matches: [] };

  const trusted = TRUSTED_PATTERNS.some((p) => p.test(text));
  let score = 0;
  const matches: string[] = [];

  for (const { pattern, weight, label } of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      score += weight;
      matches.push(label);
    }
  }

  if (text.trim().length < 10 && score > 0) score += 20;
  if (trusted) score = Math.floor(score * 0.4);

  const confidence = Math.min(score, 99);
  return {
    isSpam: confidence >= 60,
    confidence,
    matches,
  };
}
