# AI-Learning Project

Interactive visualizers for transformer architecture concepts.

## Repository

- **GitHub**: https://github.com/JayAI623/AI-learning
- **Owner**: JayAI623 (personal account)
- **Default branch**: master

## Git Identity (this repo only)

This repo uses **local** git config (not global) to commit as the personal account:

```
user.name  = JayAI623
user.email = (from ~/.gitconfig-personal)
github.user = JayAI623
```

Global config remains `JayLiuMLP` (work). Local config takes priority.

## Push Workflow

SSH key is bound to `JayLiuMLP`, so pushing requires HTTPS with the JayAI623 token:

```bash
# Get the JayAI623 token (must unset GITHUB_TOKEN to access keyring account)
TOKEN=$(GITHUB_TOKEN= gh auth token)

# Push via HTTPS
git push https://JayAI623:${TOKEN}@github.com/JayAI623/AI-learning.git <branch>
```

**Do NOT use `git push origin`** — the SSH remote will be rejected because the SSH key belongs to JayLiuMLP.

## Creating PRs

Use `GITHUB_TOKEN=` prefix so `gh` uses the JayAI623 keyring auth instead of the work GITHUB_TOKEN:

```bash
GITHUB_TOKEN= gh pr create --repo JayAI623/AI-learning --base master ...
```

## Project Structure

```
index.html                          # Landing page hub
attention-visualizer/               # Self-attention mechanism
kv-cache-visualizer/                # KV-Cache in inference
moe-visualizer/                     # Mixture of Experts
positional-encoding-visualizer/     # Positional encoding
common/                             # Shared CSS tokens, page styles, JS utilities
attention-visualizer/video/         # Remotion video project
```

Each visualizer follows the pattern: `<name>/index.html`, `<name>/css/page.css`, `<name>/js/app.js`.

## Tech Stack

- Vanilla HTML/CSS/JS (no build tools for visualizers)
- Shared design tokens in `common/css/tokens.css`
- Remotion (React/TypeScript) for video generation

## Code Style

- Write code and comments in English
- Respond to user in 中文
