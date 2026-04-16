# Claude model comparison

A small web app that sends the same prompt to **Claude Haiku 4.5**, **Claude Sonnet 4.6**, and **Claude Opus 4.7** in parallel and shows the responses side by side with latency, token usage, and cost.

Designed to be hosted on [Render](https://render.com) with your Anthropic API key kept safely on the server (never exposed to the browser).

## What you get

- One textarea, one "Run comparison" button.
- Three side-by-side cards showing each model's output, response time, input/output tokens, and computed cost.
- Four preset example prompts (classification, coding, explanation, reasoning) so you can quickly see where each model shines.
- Light and dark mode (follows your OS).

## Project structure

```
claude-compare/
├── package.json          # dependencies + start script
├── server.js             # Express server, /api/compare endpoint
├── render.yaml           # Render deployment config
├── .gitignore
├── README.md
└── public/
    └── index.html        # the frontend (single file, no build step)
```

---

## Part 1 — Run it locally on Windows

### Prerequisites

1. **Install Node.js 20 or newer** — download from [nodejs.org](https://nodejs.org). Pick the LTS version. The installer adds Node and npm to your PATH automatically.
2. **Get an Anthropic API key** — sign in at [console.anthropic.com](https://console.anthropic.com), go to *API Keys*, and create a new key. Copy it somewhere safe.
3. **Install Git for Windows** — from [git-scm.com](https://git-scm.com). You'll need this for the Render deployment step.

### Set up the project

Open **PowerShell** (or Windows Terminal) and run:

```powershell
cd $HOME\Desktop
# Place the claude-compare folder here, then:
cd claude-compare
npm install
```

`npm install` will create a `node_modules` folder and install Express and the Anthropic SDK.

### Set your API key (this terminal session only)

```powershell
$env:ANTHROPIC_API_KEY="sk-ant-..."
npm start
```

You should see:

```
claude-compare listening on http://localhost:3000
```

Open `http://localhost:3000` in your browser. Type a prompt, click **Run comparison**, and you'll see all three models respond.

### Tip — set the key permanently for your user account

If you don't want to set the env var every time:

```powershell
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-...", "User")
```

Close and reopen PowerShell for it to take effect.

---

## Part 2 — Deploy to Render

Render will build and host the app and give you a public URL: `https://ken-claude-compare.onrender.com`.

### Step 1 — Push the project to GitHub

If you don't already have a GitHub account, create one at [github.com](https://github.com).

Create a new empty repository (let's call it `claude-compare`). **Don't** initialize it with a README — you already have one.

In PowerShell, from the project folder:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/claude-compare.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 2 — Create the Render service

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and pick the `claude-compare` repository.
4. Render will detect the `render.yaml` file and pre-fill most fields. Confirm:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Plan:** Free (you can upgrade later)
5. Scroll to **Environment Variables** and add:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** your Anthropic API key (`sk-ant-...`)
6. Click **Create Web Service**.

Render will build and deploy. After ~2 minutes you'll have a public URL.

### Step 3 — Test it

Open the Render URL in your browser. Click an example chip, then **Run comparison**. You should see all three models respond.

---

## How it works

**`server.js`** exposes one endpoint, `POST /api/compare`. It receives `{ prompt, maxTokens }`, then fans the prompt out to all three models in parallel using `Promise.all`. For each model it captures:

- response text
- elapsed time in milliseconds
- input and output token counts (from the API response's `usage` field)
- cost (computed from the published per-million-token rates)

The frontend (`public/index.html`) is a single file with no build step — vanilla HTML, CSS, and JavaScript. It calls `/api/compare` and renders the three cards.

**Your API key never reaches the browser.** All calls to Anthropic happen server-side. The frontend only ever talks to your own server.

## Cost notes

Each "Run comparison" makes three real API calls. Rough costs per run (assuming ~50 input tokens, ~500 output tokens):

| Model | Cost per run |
|-------|--------------|
| Haiku 4.5 | ~$0.0025 |
| Sonnet 4.6 | ~$0.0075 |
| Opus 4.7 | ~$0.0125 |
| **Total per run** | **~$0.025** |

So 100 comparison runs ≈ $2.50. Set spending limits in the Anthropic console if you're worried about runaway usage.

## Customizing

- **Add or remove models:** edit the `MODELS` array in `server.js`.
- **Change pricing:** update `inputPricePerM` and `outputPricePerM` in the same array if Anthropic adjusts pricing.
- **Add system prompts:** in `runOne()`, pass a `system` parameter to `client.messages.create`.
- **Stream responses:** swap `messages.create` for `messages.stream` and pipe Server-Sent Events back to the frontend.

## Troubleshooting

**"Server is missing ANTHROPIC_API_KEY"** — the env var isn't set. Locally, set it in PowerShell. On Render, add it under the service's *Environment* tab.

**Free tier sleeps after 15 minutes of inactivity** — the first request after a sleep takes ~30 seconds to wake up. Upgrade to a paid plan to avoid this.

**CORS errors** — shouldn't happen since the frontend is served by the same server. If you split frontend and backend, add the `cors` middleware.
