import { describe, expect, it } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
  it("normalizes basic titles", () => {
    expect(slugify("30 Minute Intro Call")).toBe("30-minute-intro-call");
  });

  it("removes repeated separators and punctuation", () => {
    expect(slugify(" Design / Review !!! ")).toBe("design-review");
  });
});
