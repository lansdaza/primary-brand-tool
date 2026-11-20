import { describe, expect, it } from "vitest";
import { LANDMARKS, landmarkHeight } from "@/lib/landmarks";

describe("landmark compositions", () => {
  it("Empire State tip reaches 443 m", () => expect(landmarkHeight(LANDMARKS["nyc"]!)).toBe(443));
  it("Big Ben reaches 96 m", () => expect(LANDMARKS["london"]!.parts.slice(0, 5).reduce((m, p) => Math.max(m, p.k === "dome" ? 0 : p.z1), 0)).toBe(96));
  it("every city frames a few buildings, not a whole map", () => {
    for (const lm of Object.values(LANDMARKS)) expect(lm.parts.length).toBeLessThan(40);
  });
});
