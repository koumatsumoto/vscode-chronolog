import { describe, it, expect } from "vitest";
import { parseClogFile } from "./clog";

describe("clog.ts functions", () => {
  it("parseClogFile should be defined", () => {
    expect(parseClogFile).toBeDefined();
  });
});
