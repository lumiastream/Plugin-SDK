#!/usr/bin/env node
const path = require("path");
const fs = require("fs");

const DEST_DIR = path.resolve(__dirname, "..", "examples", "base_plugin");

async function main() {
	if (!fs.existsSync(DEST_DIR)) return;
	await fs.promises.rm(DEST_DIR, { recursive: true, force: true });
}

main().catch((error) => {
	console.error("✖ Failed to clean template:", error?.message ?? error);
	process.exit(1);
});
