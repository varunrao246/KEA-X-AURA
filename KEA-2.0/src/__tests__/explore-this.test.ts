import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { exploreConceptResources, buildConceptSearchKey } from "../lib/resources/explore-service";

describe("🔎 KEA Explore This & Misconception-Driven Intelligence Suite", () => {
  it("1. Generates categorized resources for specific concepts rather than generic topic", async () => {
    const result = await exploreConceptResources({
      topic: "Algorithms",
      conceptTitle: "Binary Search Complexity",
    });

    assert.equal(result.topic, "Algorithms");
    assert.equal(result.conceptTitle, "Binary Search Complexity");
    assert.ok(result.resources.length >= 3, "Must return curated categorized resources");

    // Check categories
    const categories = result.resources.map((r) => r.category);
    assert.ok(categories.includes("research"), "Must include research paper discovery");
    assert.ok(categories.includes("academic"), "Must include university/academic resource");
    assert.ok(categories.includes("video"), "Must include video resource");
    assert.ok(categories.includes("real_world"), "Must include real-world industrial application");
  });

  it("2. Discovered research papers provide title, authors, year, and 'Why this matters' relevance", async () => {
    const result = await exploreConceptResources({
      topic: "Computer Science",
      conceptTitle: "Binary Search",
    });

    const paper = result.resources.find((r) => r.category === "research");
    assert.ok(paper, "Research paper must exist");
    assert.ok(paper.title, "Must have paper title");
    assert.ok(paper.whyRelevant.toLowerCase().includes("matters") || paper.whyRelevant.length > 20);
    assert.ok(paper.year && paper.year > 2000, "Must have publication year");
  });

  it("3. Misconception-driven discovery targets the specific misconception with specialized headline", async () => {
    const misconception = "Binary search checks every element";
    const result = await exploreConceptResources({
      topic: "Algorithms",
      conceptTitle: "Binary Search",
      misconception,
    });

    assert.equal(result.misconceptionTargeted, misconception);
    assert.ok(
      result.headline.includes("Resources that may help with this specific idea"),
      "Headline must highlight the targeted misconception"
    );
    assert.ok(
      result.resources.some((r) => r.whyRelevant.toLowerCase().includes("misconception") || r.shortDescription.toLowerCase().includes("animation")),
      "Must feature resources addressing the specific misconception"
    );
  });

  it("4. Videos include timestamp markers for micro-scaffolding", async () => {
    const result = await exploreConceptResources({
      topic: "Mathematics",
      conceptTitle: "Comparing Fractions",
    });

    const video = result.resources.find((r) => r.category === "video");
    assert.ok(video, "Video resource must exist");
    assert.ok(
      typeof video.keyMomentTimestamp === "number" && video.keyMomentTimestamp > 0,
      "Video must have key moment timestamp for direct deep-linking"
    );
  });

  it("5. Strict caching: second call returns from cache with zero network cost", async () => {
    const first = await exploreConceptResources({
      topic: "Organic Chemistry",
      conceptTitle: "Esterification",
    });

    const second = await exploreConceptResources({
      topic: "Organic Chemistry",
      conceptTitle: "Esterification",
    });

    assert.equal(second.fromCache, true, "Second call must return from memory cache");
    assert.equal(first.resources.length, second.resources.length);
  });

  it("6. Real-World Applications connect classroom concepts to industrial technology", async () => {
    const result = await exploreConceptResources({
      topic: "Organic Chemistry",
      conceptTitle: "Fischer Esterification",
    });

    const realWorld = result.resources.find((r) => r.category === "real_world");
    assert.ok(realWorld, "Real-world connection must be present");
    assert.ok(
      realWorld.shortDescription.toLowerCase().includes("biodiesel") ||
      realWorld.shortDescription.toLowerCase().includes("flavoring") ||
      realWorld.shortDescription.toLowerCase().includes("fragrances")
    );
  });
});
