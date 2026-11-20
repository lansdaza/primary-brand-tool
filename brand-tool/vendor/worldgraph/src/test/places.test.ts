import { describe, expect, it } from "vitest";
import { searchPlaces } from "@/lib/places";

describe("searchPlaces", () => {
  it("finds Texas near its centre", () => {
    const t = searchPlaces("texas")[0]!;
    expect(t.name).toBe("Texas");
    expect(Math.abs(t.lat - 31)).toBeLessThan(2);
    expect(Math.abs(t.lng + 99)).toBeLessThan(2);
  });
  it("finds France on the mainland", () => {
    const f = searchPlaces("france")[0]!;
    expect(f.name).toBe("France");
    expect(f.lat).toBeGreaterThan(42);
  });
  it("returns nothing for an empty query", () => {
    expect(searchPlaces("  ")).toEqual([]);
  });
});
