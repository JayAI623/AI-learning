---
name: github-profile-switch
description: |
  Switch between GitHub profiles (work/personal). Changes git user.name, user.email,
  github.user, and gh CLI active account. Use when the user says "switch profile",
  "switch to personal", "switch to work", "change github account", "use personal github",
  "use work github", "切换 profile", "切换到个人", "切换到工作".
version: 1.0.0
date: 2026-03-15
---

# GitHub Profile Switch

Quickly switch between pre-configured GitHub profiles (git config + gh CLI auth).

## Profiles

### Work (default)
- **git user.name**: `JayLiuMLP`
- **git user.email**: `zhe.liu@doordash.com`
- **github.user**: `jayliumlp`
- **gh account**: `JayLiuMLP` (GITHUB_TOKEN)

### Personal
- **git user.name**: `JayAI623`
- **git user.email**: (from `~/.gitconfig-personal`)
- **github.user**: `JayAI623`
- **gh account**: `JayLiuMLP` (keyring) or dedicated personal token

## Switch Procedure

### Switch to Personal
```bash
# 1. Git config
git config --global user.name "JayAI623"
git config --global user.email "$(git config --file ~/.gitconfig-personal user.email)"
git config --global github.user "JayAI623"

# 2. gh CLI - switch to keyring-based auth if available
gh auth switch --user JayAI623 2>/dev/null || echo "No separate gh account for JayAI623; using token-based auth"

# 3. Verify
echo "--- Git Config ---"
git config --global user.name
git config --global user.email
echo "--- GitHub CLI ---"
gh auth status
```

### Switch to Work
```bash
# 1. Git config
git config --global user.name "JayLiuMLP"
git config --global user.email "zhe.liu@doordash.com"
git config --global github.user "jayliumlp"

# 2. gh CLI - switch to GITHUB_TOKEN auth
gh auth switch --user JayLiuMLP 2>/dev/null || echo "Already on work account"

# 3. Verify
echo "--- Git Config ---"
git config --global user.name
git config --global user.email
echo "--- GitHub CLI ---"
gh auth status
```

### Show Current Profile
```bash
echo "=== Current GitHub Profile ==="
echo "user.name:   $(git config --global user.name)"
echo "user.email:  $(git config --global user.email)"
echo "github.user: $(git config --global github.user)"
echo ""
gh auth status 2>&1 | grep -E '(account|Active)'
```

## Behavior

1. If user says "switch profile" without specifying which, show current profile and ask which to switch to.
2. After switching, always run the verify step and show the result.
3. The `~/.gitconfig` `includeIf` rules still apply per-directory, overriding global config in `~/personal/` and `~/Desktop/claude-code-config/` directories.
