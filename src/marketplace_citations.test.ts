import test from "node:test";
import assert from "node:assert/strict";
import { chooseHandoff, dedupeCitations } from "./marketplace_citations.ts";

test("the handoff is ready only after two distinct source URLs", () => {
  const citations = dedupeCitations([{ title: "A", url: "https://sources.test/a", excerpt: "first" }, { title: "A again", url: "https://sources.test/a", excerpt: "duplicate" }, { title: "B", url: "https://sources.test/b", excerpt: "second" }]);
  assert.equal(citations.length, 2);
  assert.equal(chooseHandoff(citations, "buyer confirmed the scope"), "ready");
  assert.equal(chooseHandoff(citations.slice(0, 1), "buyer confirmed the scope"), "needs-sources");
});
