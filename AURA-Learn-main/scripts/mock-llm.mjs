// A tiny stand-in for an OpenAI-compatible model API (OpenRouter), for demos and tests without a real key.
//
//   node scripts/mock-llm.mjs                  # listens on :4010
//   OPENROUTER_API_KEY=demo OPENROUTER_BASE_URL=http://localhost:4010 npm run dev
//
// It behaves like a reasonable model, and can be told to misbehave so you can watch AURA's guardrails work:
//   curl -X POST localhost:4010/__mode -d '{"mode":"bad-number"}'
// Modes: good | bad-number | bad-unit | bad-leak | fence | garbage | error500 | slow
import http from "node:http";

const PORT = Number(process.env.MOCK_LLM_PORT || 4010);
let mode = process.env.MOCK_MODE || "good";
const calls = [];

const LEADS = {
  Space: "Mission Control is running a systems check on the spacecraft.",
  Gaming: "In your favourite sci-fi game, a gadget on your character's belt needs a power check.",
  Sports: "The stadium engineers are testing the equipment before the big match.",
  Animals: "A ranger is checking the equipment in a wildlife reserve.",
  Technology: "A robotics team is bench-testing a new prototype.",
  Environment: "A field scientist is servicing a station in a nature reserve.",
  Art: "An artist is powering up a glowing exhibit for tonight's show.",
};

function rewrite(payload) {
  const lead = LEADS[payload.studentInterest] || "Here is a quick challenge.";
  let stem = `${lead} ${payload.question}`;
  if (mode === "bad-number") stem = stem.replace(/\d+(\.\d+)?/, (n) => String(Number(n) + 1));
  if (mode === "bad-unit") stem = stem.replace(/(\d)\s?V\b/, "$1 A");
  if (mode === "bad-leak") stem += ` (Hint: the answer is ${payload.correctAnswer}.)`;
  const echo = { numbers: payload.variables ? Object.values(payload.variables) : [], unit: payload.correctAnswer?.split(" ").slice(1).join(" ") ?? "", difficulty: payload.difficulty, learningObjective: payload.learningObjective, answerUnchanged: true };
  return { stem, echo };
}

http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    if (req.url === "/__mode" && req.method === "POST") { mode = JSON.parse(raw || "{}").mode || "good"; res.writeHead(200); return res.end(JSON.stringify({ mode })); }
    if (req.url === "/__calls") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(calls)); }
    if (!req.url?.endsWith("/chat/completions")) { res.writeHead(404); return res.end("not found"); }
    const body = JSON.parse(raw || "{}");
    const user = body.messages?.find((m) => m.role === "user")?.content ?? "";
    const payload = JSON.parse(user.slice(user.indexOf("{")));
    calls.push({ at: new Date().toISOString(), auth: req.headers.authorization, model: body.model, interest: payload.studentInterest, question: payload.question, mode });
    const reply = (content) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content } }] })); };
    if (mode === "error500") { res.writeHead(500); return res.end("mock upstream failure"); }
    if (mode === "garbage") return reply("Sure! Here is a nice question for you.");
    const out = JSON.stringify(rewrite(payload));
    if (mode === "fence") return reply("```json\n" + out + "\n```");
    if (mode === "slow") return setTimeout(() => reply(out), 10_000);
    return reply(out);
  });
}).listen(PORT, () => console.log(`mock LLM on http://localhost:${PORT} (mode: ${mode})`));
