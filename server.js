import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn("WARNING: ANTHROPIC_API_KEY not set. /api/compare will fail until you set it.");
}

const client = new Anthropic({ apiKey });

// Pricing per million tokens (input / output) — keep in sync with Anthropic pricing page.
const MODELS = [
  {
    id: "claude-haiku-4-5",
    label: "Haiku 4.5",
    inputPricePerM: 1,
    outputPricePerM: 5,
  },
  {
    id: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    inputPricePerM: 3,
    outputPricePerM: 15,
  },
  {
    id: "claude-opus-4-7",
    label: "Opus 4.7",
    inputPricePerM: 5,
    outputPricePerM: 25,
  },
];

async function runOne(model, prompt, maxTokens) {
  const start = Date.now();
  try {
    const response = await client.messages.create({
      model: model.id,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });

    const elapsedMs = Date.now() - start;
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost =
      (inputTokens / 1_000_000) * model.inputPricePerM +
      (outputTokens / 1_000_000) * model.outputPricePerM;

    return {
      model: model.label,
      modelId: model.id,
      ok: true,
      elapsedMs,
      inputTokens,
      outputTokens,
      cost,
      text,
    };
  } catch (err) {
    return {
      model: model.label,
      modelId: model.id,
      ok: false,
      elapsedMs: Date.now() - start,
      error: err.message || String(err),
    };
  }
}

app.post("/api/compare", async (req, res) => {
  const { prompt, maxTokens = 1024 } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt (string) is required" });
  }
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });
  }

  const results = await Promise.all(MODELS.map((m) => runOne(m, prompt, maxTokens)));
  res.json({ results });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(apiKey) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`claude-compare listening on http://localhost:${PORT}`);
});
