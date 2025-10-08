const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

const DEFAULT_IGNORE = new Set([
	".git",
	".DS_Store",
	"Thumbs.db",
	"package-lock.json",
	"yarn.lock",
	".npmrc",
	".gitignore",
]);

function toPosix(p) {
	return p.split(path.sep).join("/");
}

async function readManifest(pluginDir) {
	const manifestPath = path.join(pluginDir, "manifest.json");
	const raw = await fs.promises.readFile(manifestPath, "utf8");
	return { manifest: JSON.parse(raw), manifestPath };
}

function validateManifest(manifest) {
	const errors = [];
	const requiredStringFields = [
		"id",
		"name",
		"version",
		"author",
		"description",
		"license",
		"lumiaVersion",
	];
	for (const field of requiredStringFields) {
		const value = manifest[field];
		if (typeof value !== "string" || value.trim().length === 0) {
			errors.push(`Missing or invalid manifest field: ${field}`);
		}
	}

	if (
		!manifest.category ||
		(typeof manifest.category !== "string" && !Array.isArray(manifest.category))
	) {
		errors.push("Manifest must declare a category string");
	}

	if (!manifest.config || typeof manifest.config !== "object") {
		errors.push("Manifest config must be an object");
	}

	if (manifest.config) {
		if (manifest.config.settings && !Array.isArray(manifest.config.settings)) {
			errors.push("config.settings must be an array when provided");
		}
		if (manifest.config.actions && !Array.isArray(manifest.config.actions)) {
			errors.push("config.actions must be an array when provided");
		}
		if (
			manifest.config.variables &&
			!Array.isArray(manifest.config.variables)
		) {
			errors.push("config.variables must be an array when provided");
		}
		if (manifest.config.alerts && !Array.isArray(manifest.config.alerts)) {
			errors.push("config.alerts must be an array when provided");
		}
	}

	return errors;
}

async function collectFiles(pluginDir, ignore = DEFAULT_IGNORE) {
	const entries = [];

	async function walk(currentDir) {
		const list = await fs.promises.readdir(currentDir, { withFileTypes: true });
		for (const entry of list) {
			if (ignore.has(entry.name)) continue;
			const absolute = path.join(currentDir, entry.name);
			const relative = path.relative(pluginDir, absolute);
			if (!relative || relative.startsWith("..")) continue;

			// Skip bundled Lumia packages in node_modules
			if (
				relative === "node_modules/@lumiastream" ||
				relative.startsWith("node_modules/@lumiastream/plugin") ||
				relative.startsWith("node_modules/lumia-plugin")
			) {
				continue;
			}

			if (entry.isDirectory()) {
				await walk(absolute);
			} else if (entry.isFile()) {
				entries.push({ absolute, relative: toPosix(relative) });
			}
		}
	}

	await walk(pluginDir);
	return entries;
}

async function createPluginArchive(pluginDir, outputFile, files) {
	const zip = new JSZip();
	for (const file of files) {
		const data = await fs.promises.readFile(file.absolute);
		zip.file(file.relative, data);
	}
	const content = await zip.generateAsync({
		type: "nodebuffer",
		compression: "DEFLATE",
		compressionOptions: { level: 9 },
	});
	await fs.promises.mkdir(path.dirname(outputFile), { recursive: true });
	await fs.promises.writeFile(outputFile, content);
	return outputFile;
}

module.exports = {
	readManifest,
	validateManifest,
	collectFiles,
	createPluginArchive,
	DEFAULT_IGNORE,
};
