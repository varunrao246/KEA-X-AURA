import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readAiConfig, aiConfigured } from "./env";
import { createOpenRouterClient, LlmError, redact } from "./llm";
import { CircuitBreaker, RateLimiter } from "./resilience";

let server: http.Server;
let base = "";
const seen: { headers: http.IncomingHttpHeaders; body: any }[] = [];
let behaviour: "ok" | "500" | "slow" | "garbage" | "empty" = "ok";

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      seen.push({ headers: req.headers, body: JSON.parse(raw || "{}") });
      if (behaviour === "500") { res.writeHead(500); return res.end("upstream exploded, key was sk-live-abcdef123456"); }
      if (behaviour === "garbage") { res.writeHead(200); return res.end("not json"); }
      if (behaviour === "empty") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ choices: [] })); }
      const send = () => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ choices: [{ message: { content: '{"stem":"hello"}' } }] })); };
      behaviour === "slow" ? setTimeout(send, 600) : send();
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

const client = (o = {}) => createOpenRouterClient({ ...readAiConfig({}), apiKey: "sk-test-secret-987654", baseUrl: base, model: "test/model", timeoutMs: 300, ...o });

describe("model client", () => {
  it("calls /chat/completions with the key in the Authorization header only", async () => {
    behaviour = "ok";
    const r = await client().complete([{ role: "user", content: "hi" }]);
    expect(r.text).toBe('{"stem":"hello"}');
    const last = seen.at(-1)!;
    expect(last.headers.authorization).toBe("Bearer sk-test-secret-987654");
    expect(last.body).toMatchObject({ model: "test/model", messages: [{ role: "user", content: "hi" }], response_format: { type: "json_object" } });
    expect(JSON.stringify(last.body)).not.toContain("sk-test-secret");
  });

  it("raises a typed error for HTTP failures and redacts secrets from the message", async () => {
    behaviour = "500";
    const err = await client().complete([{ role: "user", content: "hi" }]).catch((e) => e);
    expect(err).toBeInstanceOf(LlmError);
    expect(err).toMatchObject({ kind: "http_error", status: 500 });
    expect(err.message).not.toMatch(/sk-live-abcdef123456/);
  });

  it("times out instead of hanging", async () => {
    behaviour = "slow";
    const t0 = Date.now();
    const err = await client({ timeoutMs: 100 }).complete([{ role: "user", content: "hi" }]).catch((e) => e);
    expect(err).toMatchObject({ kind: "timeout" });
    expect(Date.now() - t0).toBeLessThan(500);
  });

  it("flags unusable responses", async () => {
    behaviour = "garbage";
    expect(await client().complete([]).catch((e) => e)).toMatchObject({ kind: "invalid_response" });
    behaviour = "empty";
    expect(await client().complete([]).catch((e) => e)).toMatchObject({ kind: "invalid_response" });
  });

  it("reports a refused connection as a network error", async () => {
    const err = await client({ baseUrl: "http://127.0.0.1:1" }).complete([]).catch((e) => e);
    expect(err).toMatchObject({ kind: "network" });
    expect(err.message).not.toContain("sk-test-secret");
  });

  it("refuses to be created without a key", () => {
    expect(() => createOpenRouterClient(readAiConfig({}))).toThrow(/OPENROUTER_API_KEY/);
  });

  it("redacts key-shaped strings and an explicit secret", () => {
    expect(redact("token sk-abc12345678 and or-xyz98765432", "plain-secret")).toBe("token [redacted] and [redacted]");
    expect(redact("has plain-secret inside", "plain-secret")).toBe("has [redacted] inside");
  });
});

describe("configuration", () => {
  it("reads everything from environment variables, with safe defaults", () => {
    const d = readAiConfig({});
    expect(d).toMatchObject({ mode: "auto", apiKey: undefined, baseUrl: "https://openrouter.ai/api/v1", timeoutMs: 7000 });
    expect(aiConfigured(d)).toBe(false);
    const c = readAiConfig({ OPENROUTER_API_KEY: " key ", OPENROUTER_MODEL: "m/x", OPENROUTER_BASE_URL: "http://h/v1/", AI_TIMEOUT_MS: "2500", AI_RETHEME_MODE: "template" });
    expect(c).toMatchObject({ apiKey: "key", model: "m/x", baseUrl: "http://h/v1", timeoutMs: 2500, mode: "template" });
    expect(aiConfigured(c)).toBe(false); // template mode never calls the model
    expect(aiConfigured(readAiConfig({ OPENROUTER_API_KEY: "k" }))).toBe(true);
    expect(readAiConfig({ AI_RETHEME_MODE: "nonsense" }).mode).toBe("auto");
  });
});

describe("resilience", () => {
  it("circuit breaker opens after repeated failures and half-opens after the cooldown", () => {
    let t = 0;
    const b = new CircuitBreaker({ threshold: 2, cooldownMs: 1000, now: () => t });
    expect(b.canCall()).toBe(true);
    b.failure(); expect(b.canCall()).toBe(true);
    b.failure(); expect(b.state).toBe("open"); expect(b.canCall()).toBe(false);
    t = 1001; expect(b.canCall()).toBe(true);
    b.success(); b.failure(); expect(b.canCall()).toBe(true);
  });
  it("rate limiter is per key and per window", () => {
    let t = 0;
    const l = new RateLimiter({ max: 2, windowMs: 1000, now: () => t });
    expect([l.allow("a"), l.allow("a"), l.allow("a"), l.allow("b")]).toEqual([true, true, false, true]);
    t = 1001; expect(l.allow("a")).toBe(true);
  });
});
