import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, generate } from "@/lib/designShapes";

describe("design particles", () => {
  it("makes the requested number of specks", () => {
    expect(generate({ settings: { ...DEFAULT_SETTINGS, density: 5000 } }).length).toBe(15000);
  });
  it("keeps specks at least the separation apart", () => {
    const a = generate({ settings: { ...DEFAULT_SETTINGS, shape: "cube", density: 5000, separation: 0.05 } });
    let min = Infinity;
    for (let i = 0; i < 300 * 3; i += 3) for (let j = i + 3; j < a.length; j += 3) {
      min = Math.min(min, Math.hypot(a[i]! - a[j]!, a[i + 1]! - a[j + 1]!, a[i + 2]! - a[j + 2]!));
    }
    expect(min).toBeGreaterThanOrEqual(0.05);
  });
});
