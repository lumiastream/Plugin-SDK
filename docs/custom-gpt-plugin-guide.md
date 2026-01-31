# Custom GPT for Lumia Plugin Creation

Use this playbook to build a Custom GPT inside ChatGPT that walks creators through every step of writing, packaging, and validating Lumia Stream plugins—without installing extra tooling. Share the resulting GPT with your community so they can stay inside ChatGPT while they work.

## Prerequisites

- ChatGPT Plus (custom GPTs currently require a paid plan).
- This repository (or the latest SDK docs) handy so you can upload reference material.
- Optional: a ZIP of your canonical examples (for instance the `examples/` folder) so the GPT can quote real code.

## Prep the Reference Pack

### Option A – Use the helper script

Once dependencies are installed (`npm install`), run:

```bash
npm run package-docs
```

This populates `gpt-knowledge/lumia-plugin-sdk-docs/` with the core guides, a single `examples__bundle.md` that concatenates every example source file, and this playbook—ready to upload directly in the GPT builder. Add more files with `--include path/to/file.md`, or change the destination with `--out custom/folder`. The helper copies files locally (no compression), flattens other nested paths using `__` in the filenames, and automatically skips `node_modules`, `.lumiaplugin` archives, and common asset formats such as `.png`, `.jpg`, `.gif`, and `.mp4`. When you're ready to upload, select every file inside that folder (including `examples__bundle.md`) and drag them into the Knowledge uploader.

### Option B – Manual selection

1. Export the SDK docs you want the GPT to rely on. At minimum grab:
   - `docs/getting-started.md`
   - `docs/manifest-guide.md`
   - `docs/api-reference.md`
   - `docs/field-types-reference.md`
2. Drop the chosen files into a staging folder (you can reuse `gpt-knowledge/lumia-plugin-sdk-docs/` or create another such as `gpt-knowledge/custom-pack/`) and, if needed, merge example snippets into a single markdown file similar to `examples__bundle.md`. Avoid including `node_modules`, compiled `.lumiaplugin` bundles, or heavy media assets—the helper skips them automatically. If the GPT builder insists on a single file, briefly compress the folder, upload, then delete the archive afterward.
3. Optionally add curated example manifests, plugin source files, or troubleshooting notes. Organize them by topic so the GPT can cite the right file names.

## Build the Custom GPT

1. Open [chatgpt.com](https://chatgpt.com), click **Explore GPTs**, then **Create**.
2. In the **Name** field use something obvious like `Lumia Plugin Builder`.
3. Paste the following into **Instructions** (tweak names/links if your SDK fork differs):

   ```text
   You are Lumia Plugin Builder, a technical assistant that helps creators plan, implement, test, and publish Lumia Stream plugins.

   Goals:
   - Follow the Lumia Plugin SDK conventions documented in the attached files.
   - Guide users through the entire lifecycle: ideation, manifest design, TypeScript/JavaScript implementation, packaging (.lumiaplugin), and validation.
   - Surface actionable checklists and code snippets tailored to the user's request, citing the exact doc or example you relied on.
   - Highlight common pitfalls (manifest version mismatches, missing config fields, misunderstood lifecycle hooks) proactively.
   - Always confirm the user's environment (language preference, tooling, Lumia version) before giving commands or code.

   Behaviors:
   - Break complex tasks into numbered steps the user can execute within ChatGPT or a terminal.
   - Offer alternative approaches (TypeScript vs JavaScript, CLI usage vs manual build) when relevant.
   - Provide ready-to-run snippets and explain required imports, file names, and where to place each snippet.
   - Validate manifests or code when users paste them by pointing out exact lines that need changes.
   - Suggest follow-up testing using `npx lumia-plugin validate` or, if the user lacks the CLI, describe manual checks.
   ```

4. Scroll to **Knowledge**, click **Upload**, and multi-select every file from your staging directory. Keep the label short (e.g., `Lumia SDK Docs`) and confirm each file is listed once ingestion finishes.
5. In **Capabilities** enable **Code Interpreter** so the GPT can analyze pasted manifests or run quick JSON validation. Disable browsing unless you intend it to cite external pages.
6. Under **Actions** leave empty unless you have a public API for publishing plugins. (You can add one later if Lumia exposes HTTP endpoints.)
7. Add a concise description such as: “Guides you through designing, coding, validating, and packaging Lumia Stream plugins.”
8. Optionally craft a starter conversation prompt like: “Help me build a Lumia plugin that reacts to Twitch followers.”
9. Click **Save**. Decide whether to keep the GPT private, share with a link, or publish to the GPT Store.

## Onboarding Users

- Share the GPT link alongside a short README that explains prerequisites (Node.js 18+, Lumia Stream desktop app, `npx`).
- Encourage new users to start with “Plan a plugin idea” so the GPT can gather requirements before generating code.
- Suggest they upload their work-in-progress manifest or code so the GPT can review diffs and flag mistakes.

## Maintenance Tips

- Update the knowledge pack whenever the SDK docs change (manifest schema, new lifecycle hooks, etc.).
- Keep an internal change log so you remember which GPT version references which SDK release.
- Periodically test the GPT by asking it to create a fresh plugin—verify the manifest passes `npx lumia-plugin validate`.
- Gather feedback from plugin creators and refine the **Instructions** block accordingly (for example, emphasize best practices you keep seeing missed).

With these steps your community can lean on ChatGPT as a co-pilot for Lumia Stream plugin development, from first idea to published `.lumiaplugin`.
