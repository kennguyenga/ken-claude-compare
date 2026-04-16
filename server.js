'use strict';

require('dotenv').config();

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Model configuration
// ---------------------------------------------------------------------------
const MODELS = [
  {
    id: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    // Pricing per million tokens (MTok)
    inputPricePerMTok: 0.8,
    outputPricePerMTok: 4.0,
  },
  {
    id: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    inputPricePerMTok: 3.0,
    outputPricePerMTok: 15.0,
  },
  {
    id: 'claude-opus-4-5',
    label: 'Claude Opus 4.5',
    inputPricePerMTok: 15.0,
    outputPricePerMTok: 75.0,
  },
];

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Helper: call one model and return structured result
// ---------------------------------------------------------------------------
async function callModel(client, model, prompt) {
  const start = Date.now();
  const message = await client.messages.create({
    model: model.id,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const latencyMs = Date.now() - start;

  const inputTokens = message.usage.input_tokens;
  const outputTokens = message.usage.output_tokens;
  const costUsd =
    (inputTokens / 1_000_000) * model.inputPricePerMTok +
    (outputTokens / 1_000_000) * model.outputPricePerMTok;

  const content = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return {
    modelId: model.id,
    label: model.label,
    content,
    latencyMs,
    inputTokens,
    outputTokens,
    costUsd,
  };
}

// ---------------------------------------------------------------------------
// POST /api/compare
// ---------------------------------------------------------------------------
app.post('/api/compare', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'prompt is required and must be a non-empty string' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const results = await Promise.allSettled(
    MODELS.map((model) => callModel(client, model, prompt.trim()))
  );

  const responses = results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      modelId: MODELS[i].id,
      label: MODELS[i].label,
      error: result.reason?.message || 'Unknown error',
    };
  });

  res.json({ responses });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
