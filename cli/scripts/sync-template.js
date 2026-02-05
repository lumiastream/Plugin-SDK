#!/usr/bin/env node
const path = require("path");
const fs = require("fs");

const SOURCE_DIR = path.resolve(__dirname, "..", "..", "examples", "base_plugin");
const DEST_DIR = path.resolve(__dirname, "..", "examples", "base_plugin");

async function copyDir(src, dest) {
	const stats = await fs.promises.stat(src);
	if (stats.isDirectory()) {
		await fs.promises.mkdir(dest, { recursive: true });
		const entries = await fs.promises.readdir(src);
		for (const entry of entries) {
			await copyDir(path.join(src, entry), path.join(dest, entry));
		}
		return;
	}
	if (stats.isFile()) {
		await fs.promises.copyFile(src, dest);
	}
}

async function main() {
	const sourceExists = fs.existsSync(SOURCE_DIR);
	const destExists = fs.existsSync(DEST_DIR);

	if (!sourceExists && !destExists) {
		console.error("✖ Template source not found:", SOURCE_DIR);
		process.exit(1);
	}

	if (!sourceExists) {
		console.warn("⚠ Template source missing, leaving existing copy in place.");
		return;
	}

	if (destExists) {
		await fs.promises.rm(DEST_DIR, { recursive: true, force: true });
	}

	await copyDir(SOURCE_DIR, DEST_DIR);
}

main().catch((error) => {
	console.error("✖ Failed to sync template:", error?.message ?? error);
	process.exit(1);
});
