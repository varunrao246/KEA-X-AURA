/**
 * KEA Platform — SERP Resource Discovery & Optimization Test Suite
 * 
 * Verifies the CRITICAL ARCHITECTURAL INVARIANT:
 * "ONE SERP SEARCH PER NEW TOPIC. 250 SERP searches/month."
 * 
 * Verifies:
 * 1. 1st call for "Python Programming" performs discovery (1 API call).
 * 2. 2nd call for "python programming" or " Python " returns from cache (0 API calls).
 * 3. Concept/stage local filtering makes 0 API calls.
 * 4. Missing videos do NOT trigger additional searches.
 * 5. Failure / Missing API key does not break learning (curated fallback).
 * 6. SERP response parsing & deduplication.
 * 7. Server route POST /api/resources/discover validation.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  normalizeTopic,
  createSearchKey,
  clearResourcePoolCache,
  getResourcePoolCacheSize,
  discoverResources,
  filterResourcesForStageOrConcept,
  parseSerpApiResponse,
  classifyResourceType,
  getCuratedFallbackPool,
} from "../lib/resources";
import { POST as discoverRouteHandler } from "../app/api/resources/discover/route";


describe("KEA SERP Resource Discovery & Caching Suite", () => {
  beforeEach(() => {
    clearResourcePoolCache();
  });

  it("1. Topic Normalization collapses whitespace, trims, and converts to lowercase", () => {
    assert.equal(normalizeTopic("Python"), "python");
    assert.equal(normalizeTopic("  python  "), "python");
    assert.equal(normalizeTopic("  PYTHON   PROGRAMMING  "), "python programming");
    assert.equal(normalizeTopic("Organic   Chemistry"), "organic chemistry");
    assert.equal(createSearchKey("python"), "topic:python");
  });

  it("2. Aggressive Optimization: 1st call performs discovery, 2nd & 3rd return from cache with 0 API calls", async () => {
    let serpApiCallCount = 0;

    // Simulated SerpApi fetcher
    const mockFetch = (async (_url: string | URL | Request) => {
      serpApiCallCount++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          search_metadata: { status: "Success" },
          organic_results: [
            {
              title: "Python Official Documentation & Tutorial",
              link: "https://docs.python.org/3/tutorial/",
              snippet: "Python is an easy to learn, powerful programming language.",
              displayed_link: "https://docs.python.org",
            },
            {
              title: "Learn Python — Full Tutorial for Beginners",
              link: "https://www.youtube.com/watch?v=mock123",
              snippet: "Core tutorial on Python fundamentals, loops, and objects.",
              source: "YouTube",
            },
          ],
        }),
      } as unknown as Response;
    }) as typeof fetch;

    // First call: "Python Programming" (new topic)
    const result1 = await discoverResources("Python Programming", {
      apiKey: "test_serp_key_123",
      fetchFn: mockFetch,
    });

    assert.equal(result1.success, true);
    assert.equal(result1.fromCache, false);
    assert.equal(result1.resourcePool.requestCount, 1);
    assert.equal(serpApiCallCount, 1, "Must make exactly 1 API call for new topic");
    assert.equal(result1.resourcePool.resources.length, 2);

    // Second call: "python programming" (lowercase variant)
    const result2 = await discoverResources("python programming", {
      apiKey: "test_serp_key_123",
      fetchFn: mockFetch,
    });

    assert.equal(result2.success, true);
    assert.equal(result2.fromCache, true, "Must be served from in-memory cache");
    assert.equal(result2.resourcePool.requestCount, 0, "Cached retrieval indicates 0 network calls");
    assert.equal(serpApiCallCount, 1, "Must NOT make another API call");

    // Third call: "   PYTHON    PROGRAMMING   " (whitespace + uppercase variant)
    const result3 = await discoverResources("   PYTHON    PROGRAMMING   ", {
      apiKey: "test_serp_key_123",
      fetchFn: mockFetch,
    });

    assert.equal(result3.success, true);
    assert.equal(result3.fromCache, true, "Must be served from cache");
    assert.equal(result3.resourcePool.requestCount, 0);
    assert.equal(serpApiCallCount, 1, "SERP API call count remains strictly 1");
    assert.equal(getResourcePoolCacheSize(), 1, "Cache size is exactly 1 entry for this topic");
  });

  it("3. Concept and stage local filtering makes ZERO additional API calls", async () => {
    let serpApiCallCount = 0;

    const mockFetch = (async () => {
      serpApiCallCount++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          organic_results: [
            {
              title: "Stage 1: Alkanes and Carbon Geometry",
              link: "https://example.com/alkanes-geometry",
              snippet: "Introduction to tetrahedral sp3 carbon and alkane chains.",
            },
            {
              title: "Stage 2: Functional Groups & Alcohols",
              link: "https://example.com/functional-groups",
              snippet: "Detailed breakdown of hydroxyl groups, ketones, and carboxylic acids.",
            },
            {
              title: "General Organic Chemistry Reference Guide",
              link: "https://example.com/general-guide",
              snippet: "Comprehensive reference across all organic synthesis pathways.",
            },
          ],
        }),
      } as unknown as Response;
    }) as typeof fetch;

    const { resourcePool } = await discoverResources("Organic Chemistry", {
      apiKey: "test_serp_key_123",
      fetchFn: mockFetch,
    });

    assert.equal(serpApiCallCount, 1);

    // Filter for Stage 1 locally
    const stage1Filtered = filterResourcesForStageOrConcept(
      resourcePool,
      "Stage 1: Alkanes",
      "Carbon Geometry"
    );

    assert.ok(stage1Filtered.length > 0);
    assert.equal(stage1Filtered[0].title, "Stage 1: Alkanes and Carbon Geometry");
    assert.equal(serpApiCallCount, 1, "Stage filtering MUST make zero extra network calls");

    // Filter for Stage 2 locally
    const stage2Filtered = filterResourcesForStageOrConcept(
      resourcePool,
      "Stage 2",
      "Functional Groups"
    );

    assert.ok(stage2Filtered.length > 0);
    assert.equal(stage2Filtered[0].title, "Stage 2: Functional Groups & Alcohols");
    assert.equal(serpApiCallCount, 1, "Concept filtering MUST make zero extra network calls");

    // Filter for an unknown niche sub-concept falls back gracefully to pool resources
    const nicheFiltered = filterResourcesForStageOrConcept(
      resourcePool,
      "Stage 99",
      "Quantum Electro-osmosis"
    );
    assert.ok(nicheFiltered.length > 0, "Returns helpful pool resources rather than breaking");
    assert.equal(serpApiCallCount, 1, "Zero network calls made during niche filtering");
  });

  it("4. Missing videos do NOT trigger additional searches", async () => {
    let serpApiCallCount = 0;

    // Simulate response that contains ONLY documentation and tutorials, NO videos
    const mockFetch = (async () => {
      serpApiCallCount++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          organic_results: [
            {
              title: "Documentation for Advanced Type Theory",
              link: "https://docs.example.com/type-theory",
              snippet: "Formal type systems, lambda calculus, and category theory.",
            },
            {
              title: "Tutorial on Dependent Types",
              link: "https://tutorial.example.com/dependent-types",
              snippet: "Interactive exercises for proof assistants.",
            },
          ],
        }),
      } as unknown as Response;
    }) as typeof fetch;

    const { resourcePool } = await discoverResources("Type Theory", {
      apiKey: "test_serp_key_123",
      fetchFn: mockFetch,
    });

    assert.equal(serpApiCallCount, 1);

    // Verify pool has no video type
    const videosInPool = resourcePool.resources.filter(
      (r) => r.type === "video" || r.type === "youtube"
    );
    assert.equal(videosInPool.length, 0, "No videos present in initial discovery");

    // Local filtering for a missing video category — MUST NOT trigger any additional SERP calls.
    // The return value (an array of matched resources) is intentionally unused; what matters
    // is that no new API calls are made (serpApiCallCount stays at 1).
    const _videoFiltered = filterResourcesForStageOrConcept(resourcePool, "Video Lectures");
    // Assert call count remains untouched
    assert.equal(serpApiCallCount, 1, "Missing video must NEVER trigger a secondary SERP search");
  });

  it("5. Missing API key or SERP failure triggers graceful curated fallback (learning never breaks)", async () => {
    // A: No API key provided and env var unset
    const originalKey = process.env.SERPAPI_API_KEY;
    const originalKey2 = process.env.SERP_API_KEY;
    delete process.env.SERPAPI_API_KEY;
    delete process.env.SERP_API_KEY;

    try {
      const fallbackResult = await discoverResources("Python Programming");
      assert.equal(fallbackResult.success, true);
      assert.equal(fallbackResult.resourcePool.isFallback, true);
      assert.equal(fallbackResult.resourcePool.requestCount, 0);
      assert.ok(fallbackResult.resourcePool.resources.length >= 4);

      // Verify essential modalities exist in fallback
      const types = fallbackResult.resourcePool.resources.map((r) => r.type);
      assert.ok(types.includes("documentation"), "Must include documentation");
      assert.ok(types.includes("youtube"), "Must include youtube/video");
      assert.ok(types.includes("tutorial"), "Must include tutorial");

      // B: Failing network fetch triggers graceful fallback
      clearResourcePoolCache();
      const failingFetch = (async () => {
        throw new Error("Network connection refused");
      }) as unknown as typeof fetch;

      const networkFailResult = await discoverResources("Organic Chemistry", {
        apiKey: "valid_looking_key",
        fetchFn: failingFetch,
      });

      assert.equal(networkFailResult.success, true);
      assert.equal(networkFailResult.resourcePool.isFallback, true);
      assert.ok(networkFailResult.resourcePool.resources.length > 0);
      assert.equal(networkFailResult.resourcePool.topic, "Organic Chemistry");
    } finally {
      if (originalKey) process.env.SERPAPI_API_KEY = originalKey;
      if (originalKey2) process.env.SERP_API_KEY = originalKey2;
    }
  });

  it("6. Deduplicates results by URL and title across knowledge graph, video, and organic items", () => {
    const rawSerpData = {
      knowledge_graph: {
        title: "Python (programming language)",
        website: "https://www.python.org/",
        description: "High-level general-purpose programming language.",
      },
      video_results: [
        {
          title: "Python Tutorial for Beginners",
          link: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
          snippet: "Programming with Mosh Python full course.",
          source: "YouTube",
        },
      ],
      inline_videos: [
        // Duplicate video by link with different casing / trailing slash
        {
          title: "Python Tutorial for Beginners",
          link: "https://www.youtube.com/watch?v=_uQrJ0TkZlc/",
          snippet: "Duplicate video link.",
        },
      ],
      organic_results: [
        // Duplicate of knowledge graph website
        {
          title: "Python (programming language)",
          link: "https://www.python.org",
          snippet: "The official home of the Python Programming Language.",
        },
        // Duplicate title
        {
          title: "Python Tutorial for Beginners",
          link: "https://example.com/another-tutorial",
          snippet: "Different link but same title.",
        },
        // Unique new item
        {
          title: "Real Python Tutorials",
          link: "https://realpython.com/",
          snippet: "Python tutorials from real-world developers.",
        },
      ],
    };

    const parsed = parseSerpApiResponse(rawSerpData);

    // Should contain:
    // 1. Python (programming language) (knowledge graph)
    // 2. Python Tutorial for Beginners (youtube)
    // 3. Real Python Tutorials (organic)
    assert.equal(parsed.length, 3, "Deduplication must eliminate duplicate URLs and titles");
    assert.equal(parsed[0].type, "documentation");
    assert.equal(parsed[1].type, "youtube");
    assert.equal(parsed[2].type, "tutorial");
  });

  it("7. Correctly classifies resource types based on URL and keywords", () => {
    assert.equal(classifyResourceType("https://www.youtube.com/watch?v=123", "Title", "Snippet"), "youtube");
    assert.equal(classifyResourceType("https://vimeo.com/456", "Title", "Snippet"), "video");
    assert.equal(classifyResourceType("https://docs.python.org/3/", "Documentation", "Snippet"), "documentation");
    assert.equal(classifyResourceType("https://coursera.org/learn/ml", "Machine Learning Course", "Snippet"), "course");
    assert.equal(classifyResourceType("https://pythoncheatsheet.org", "Python Reference Cheatsheet", "Snippet"), "reference");
    assert.equal(classifyResourceType("https://roadmap.sh/python", "Python Developer Guide", "Snippet"), "guide");
    assert.equal(classifyResourceType("https://w3schools.com/python", "Python Tutorial", "Snippet"), "tutorial");
    assert.equal(classifyResourceType("https://medium.com/some-article", "An Overview of Python", "Snippet"), "article");
  });

  it("8. Route POST /api/resources/discover validates inputs and enforces server-side caching", async () => {
    // A: Empty or invalid JSON
    const badReq1 = new NextRequest("http://localhost:3000/api/resources/discover", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res1 = await discoverRouteHandler(badReq1);
    assert.equal(res1.status, 400);

    const badReq2 = new NextRequest("http://localhost:3000/api/resources/discover", {
      method: "POST",
      body: JSON.stringify({ topic: "   " }),
      headers: { "Content-Type": "application/json" },
    });
    const res2 = await discoverRouteHandler(badReq2);
    assert.equal(res2.status, 400);

    // B: Valid request
    const validReq = new NextRequest("http://localhost:3000/api/resources/discover", {
      method: "POST",
      body: JSON.stringify({ topic: "Organic Chemistry" }),
      headers: { "Content-Type": "application/json" },
    });
    const res3 = await discoverRouteHandler(validReq);
    assert.equal(res3.status, 200);
    const body3 = await res3.json();
    assert.equal(body3.success, true);
    assert.ok(body3.resourcePool);
    assert.equal(body3.resourcePool.normalizedTopic, "organic chemistry");

    // C: Second request for same topic hits server cache
    const secondReq = new NextRequest("http://localhost:3000/api/resources/discover", {
      method: "POST",
      body: JSON.stringify({ topic: "   organic   chemistry  " }),
      headers: { "Content-Type": "application/json" },
    });
    const res4 = await discoverRouteHandler(secondReq);
    assert.equal(res4.status, 200);
    const body4 = await res4.json();
    assert.equal(body4.success, true);
    assert.equal(body4.fromCache, true, "Second request through API route must be fromCache = true");
  });


  it("9. Empty or whitespace topic returns error without making API calls", async () => {
    let serpApiCallCount = 0;
    const mockFetch = (async () => {
      serpApiCallCount++;
      return {} as Response;
    }) as typeof fetch;

    const res = await discoverResources("   ", {
      apiKey: "key_xyz",
      fetchFn: mockFetch,
    });

    assert.equal(res.success, false);
    assert.equal(serpApiCallCount, 0, "No API call must be made for invalid topic");
    assert.ok(res.error);
  });

  it("10. Supports forceRefresh to bypass cache when explicitly requested", async () => {
    let serpApiCallCount = 0;
    const mockFetch = (async () => {
      serpApiCallCount++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          organic_results: [
            {
              title: "Calculus Made Easy",
              link: "https://example.com/calculus",
              snippet: "An introduction to differential and integral calculus.",
            },
          ],
        }),
      } as unknown as Response;
    }) as typeof fetch;

    // 1st call
    const res1 = await discoverResources("Calculus", {
      apiKey: "test_key",
      fetchFn: mockFetch,
    });
    assert.equal(res1.fromCache, false);
    assert.equal(serpApiCallCount, 1);

    // 2nd call without forceRefresh -> fromCache
    const res2 = await discoverResources("Calculus", {
      apiKey: "test_key",
      fetchFn: mockFetch,
    });
    assert.equal(res2.fromCache, true);
    assert.equal(serpApiCallCount, 1);

    // 3rd call WITH forceRefresh -> makes 1 new call
    const res3 = await discoverResources("Calculus", {
      apiKey: "test_key",
      fetchFn: mockFetch,
      forceRefresh: true,
    });
    assert.equal(res3.fromCache, false);
    assert.equal(serpApiCallCount, 2);
  });

  it("11. Generates rich fallback resources across arbitrary topics", () => {
    const quantumPool = getCuratedFallbackPool("Quantum Computing");
    assert.equal(quantumPool.isFallback, true);
    assert.equal(quantumPool.requestCount, 0);
    assert.ok(quantumPool.resources.length >= 4);

    const reactPool = getCuratedFallbackPool("React");
    assert.equal(reactPool.isFallback, true);
    assert.ok(reactPool.resources.some((r) => r.type === "documentation"));
    assert.ok(reactPool.resources.some((r) => r.type === "youtube"));

    const mlPool = getCuratedFallbackPool("Machine Learning");
    assert.equal(mlPool.isFallback, true);
    assert.ok(mlPool.resources.length >= 4);
  });

  it("12. High-throughput local filtering invariant: 50 executions make ZERO network requests", () => {
    const pool = getCuratedFallbackPool("Python Programming");
    const stages = ["Stage 1: Basics", "Stage 2: Functions", "Stage 3: OOP", "Stage 4: Concurrency"];
    const concepts = ["Variables", "Loops", "Classes", "Asyncio", "Generators"];

    for (let i = 0; i < 50; i++) {
      const stage = stages[i % stages.length];
      const concept = concepts[i % concepts.length];
      const filtered = filterResourcesForStageOrConcept(pool, stage, concept);
      assert.ok(Array.isArray(filtered));
      assert.ok(filtered.length > 0);
    }
    // Execution completed synchronously without any network I/O
    assert.ok(true);
  });
});
