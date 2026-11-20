import { describe, expect, it } from "vitest";
import { normalizeHex } from "@/lib/backgroundColor";

describe("Custom background colors", () => {
  it("accepts a six-digit hex background", () => expect(normalizeHex("#FAF7F3")).toBe("#faf7f3"));
  it("expands shorthand hex backgrounds", () => expect(normalizeHex("abc")).toBe("#aabbcc"));
  it("rejects invalid colors", () => expect(normalizeHex("#nothex")).toBeNull());
});