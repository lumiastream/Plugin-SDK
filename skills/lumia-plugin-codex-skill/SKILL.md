---
name: lumia-plugin-codex-skill
description: Build, debug, validate, and package Lumia Stream plugins in Codex Desktop. Use when requests involve `manifest.json`, plugin entry files (`main.js` / `main.ts`), capability contracts (AI/chatbot/mod commands/lights/plugs/themes), or `lumia-plugin` create/validate/build workflows.
---

# Lumia Plugin Development For Codex

## Overview

Develop Lumia plugins with fast feedback loops: scaffold from the best-fit example, implement hooks that match `manifest.json`, and run validation before packaging.

## Quick Start

1. Identify plugin root and confirm `manifest.json` exists.
2. Run `npx lumia-plugin validate <plugin-dir>` to surface baseline errors.
3. Read capability contracts in [references/manifest-capability-contracts.md](./references/manifest-capability-contracts.md) before editing hook code.
4. Run `node scripts/plugin-audit.js <plugin-dir>` to check capability-to-hook alignment.
5. Build package with `npx lumia-plugin build <plugin-dir> [--out <name>.lumiaplugin]`.

## Workflow

### 1. Choose a starting pattern

- For a net-new plugin, scaffold with `npx lumia-plugin create <name>`.
- For feature-specific work, copy structure from the nearest SDK example (`examples/`), then adapt.
- Keep changes minimal and capability-focused; do not add unrelated settings/actions.

### 2. Implement by manifest contract

- Treat `manifest.json` as the source of truth for runtime behavior.
- Add or update hook methods in the entry file to satisfy declared capabilities.
- Validate settings/actions field objects for required keys before runtime testing.
- Use the contract table in [references/manifest-capability-contracts.md](./references/manifest-capability-contracts.md) for required and recommended hook coverage.

### 3. Validate aggressively

- Run CLI validation first: `npx lumia-plugin validate <plugin-dir>`.
- Run capability audit: `node scripts/plugin-audit.js <plugin-dir>`.
- If a plugin uses TypeScript, run project type-check/build before packaging.
- Fix required issues before continuing; treat recommended issues as product-quality improvements.

### 4. Package and handoff

- Build distributable: `npx lumia-plugin build <plugin-dir>`.
- Confirm output `.lumiaplugin` file path and size.
- Summarize changes by file and list any remaining risks (for example, untested provider APIs).

## Guardrails

- Target Node.js runtime behavior only; avoid browser-only APIs (`window`, `document`, `localStorage`, `XMLHttpRequest`).
- Keep plugin IDs stable and semver versions valid.
- Avoid inventing undocumented manifest fields.
- Prefer deterministic checks (CLI validation + audit script) over assumption-based approvals.

## Resources (optional)

### scripts/
- [scripts/plugin-audit.js](./scripts/plugin-audit.js): check `manifest.json` capability flags against implemented lifecycle hooks in the plugin entry file.

### references/
- [references/workflow.md](./references/workflow.md): command-level workflow for scaffold, edit, validate, and build.
- [references/manifest-capability-contracts.md](./references/manifest-capability-contracts.md): mapping from manifest capability fields to hook expectations.
- [references/sdk-docs/INDEX.md](./references/sdk-docs/INDEX.md): auto-synced SDK documentation snapshot generated during publish workflows.
