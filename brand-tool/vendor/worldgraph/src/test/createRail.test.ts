import { describe, it, expect } from "vitest";
import { createRail, seedRails } from "@/lib/rails";
describe("createRail", () => {
  it("gives typed endpoints distinct node names", () => {
    const r = createRail(seedRails(), { lat: 31, lng: -99, place: "Texas" }, { lat: 46, lng: 2, place: "France" }, "x");
    expect(r.a.name).not.toBe(r.b.name);
    expect(r.name).toBe("Texas – France");
  });
});
