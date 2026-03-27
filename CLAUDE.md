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

Remote is configured as **HTTPS** and `gh auth setup-git` is set up to use `JayAI623` as the credential provider.

```bash
# Standard push (works as long as GITHUB_TOKEN env var is not set)
unset GITHUB_TOKEN
git push origin master
```

If `GITHUB_TOKEN` is set in the environment (e.g. from work session), unset it first — otherwise git will authenticate as `JayLiuMLP` and be rejected.

If `gh` active account has drifted, switch it back:

```bash
unset GITHUB_TOKEN
gh auth switch --user JayAI623
git push origin master
```

## Creating PRs

```bash
unset GITHUB_TOKEN
gh pr create --repo JayAI623/AI-learning --base master ...
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
