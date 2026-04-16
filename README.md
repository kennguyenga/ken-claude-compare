# ken-claude-compare

A small web app that sends the same prompt to **Claude Haiku 4.5**, **Claude Sonnet 4.5**, and **Claude Opus 4.5** in parallel and displays the responses side by side with latency, token usage, and cost.

## Features

- Parallel API calls to three Claude models
- Side-by-side response display
- Per-model latency, input tokens, output tokens, and estimated cost
- Clean dark UI with responsive layout

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# Install dependencies
npm install

# Copy the example env file and add your API key
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=your_key_here

# Start the server
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable            | Default | Description                       |
|---------------------|---------|-----------------------------------|
| `ANTHROPIC_API_KEY` | —       | Your Anthropic API key (required) |
| `PORT`              | `3000`  | Port for the Express server       |

## Usage

1. Type a prompt in the text box.
2. Click **Compare Models** (or press `Ctrl+Enter` / `Cmd+Enter`).
3. All three models are called simultaneously; responses appear as they complete.

## Cost Estimates

Costs are calculated using the pricing below and are **estimates only**.

| Model             | Input ($/MTok) | Output ($/MTok) |
|-------------------|----------------|-----------------|
| Claude Haiku 4.5  | $0.80          | $4.00           |
| Claude Sonnet 4.5 | $3.00          | $15.00          |
| Claude Opus 4.5   | $15.00         | $75.00          |
