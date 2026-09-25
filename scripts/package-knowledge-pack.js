#!/usr/bin/env node

const fsp = require("node:fs/promises");
const path = require("node:path");
const {
	EXAMPLE_BUNDLES,
	GPT_KNOWLEDGE_FILE_LIMIT,
	PRIVATE_EXAMPLES,
	findPrivateExampleMentions,
	isPrivateExample,
	stripPrivateExampleLines,
} = require("./knowledge-config");
const {
	buildRulesKnowledge,
	codeFence,
	writeInstructionOutputs,
} = require("./build-instructions");

const projectRoot = path.resolve(__dirname, "..");

const defaultEntries = [
	"README.md",
	"docs/getting-started.md",
	"docs/manifest-guide.md",
	"docs/api-reference.md",
	"docs/field-types-reference.md",
	"docs/custom-overlays-interop.md",
];

const examplesRoot = "examples";
const rulesKnowledgeFile = "plugin-authoring-rules.md";
const outputDefault = "gpt-knowledge/lumia-plugin-sdk-docs";
const bannedSegments = new Set(["node_modules", "dist"]);
const bannedFileNames = new Set([
	"package-lock.json",
	"yarn.lock",
	"pnpm-lock.yaml",
	"bun.lockb",
]);
const allowedExtensions = new Set([
	".md",
	".txt",
	".json",
	".js",
	".cjs",
	".mjs",
	".ts",
	".cts",
	".mts",
	".tsx",
	".jsx",
	".yml",
	".yaml",
	".toml",
]);
const allowedExtensionlessFileNames = new Set(["LICENSE"]);
const fenceLanguages = {
	".js": "javascript",
	".cjs": "javascript",
	".mjs": "javascript",
	".jsx": "jsx",
	".ts": "typescript",
	".cts": "typescript",
	".mts": "typescript",
	".tsx": "tsx",
	".json": "json",
	".md": "markdown",
	".yml": "yaml",
	".yaml": "yaml",
	".toml": "toml",
};
const capabilityLabels = [
	["hasAI", "AI provider (`hasAI`)"],
	["hasChatbot", "native chatbot (`hasChatbot`)"],
	["modcommandOptions", "moderation commands"],
	["hasTtsVoices", "TTS voices (`hasTtsVoices`)"],
	["hasSongRequests", "song requests (`hasSongRequests`)"],
	["hasHeartrate", "heart rate (`hasHeartrate`)"],
	["variableFunctions", "variable functions"],
	["oauth", "OAuth"],
	["custom_auth_display", "custom auth display"],
	["lights", "lights"],
	["plugs", "plugs"],
	["keylights", "key lights"],
	["themeConfig", "studio themes"],
	["actions", "actions"],
	["alerts", "alerts"],
	["variables", "variables"],
	["translations", "translations"],
	["settings_tutorial", "settings tutorial"],
	["actions_tutorial", "actions tutorial"],
	["bundle", "bundled commands/overlays"],
];

function parseArgs(argv) {
	const args = argv.slice(2);
	const parsed = { out: outputDefault, extraEntries: [] };

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		switch (arg) {
			case "--out":
				if (!args[i + 1]) {
					throw new Error("Expected a path after --out");
				}
				parsed.out = args[++i];
				break;
			case "--include":
				if (!args[i + 1]) {
					throw new Error("Expected a path after --include");
				}
				parsed.extraEntries.push(args[++i]);
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return { ...parsed, out: parsed.out.replace(/\\/g, "/") };
}

function hasBannedSegment(entryPath) {
	return entryPath
		.split(/[\\/]/)
		.some((segment) => bannedSegments.has(segment));
}

function hasBannedFileName(entryPath) {
	return bannedFileNames.has(path.basename(entryPath));
}

function isAllowedFile(entryPath) {
	const baseName = path.basename(entryPath);
	if (allowedExtensionlessFileNames.has(baseName)) {
		return true;
	}
	return allowedExtensions.has(path.extname(baseName).toLowerCase());
}

function isPrivatePath(entryPath) {
	const [root, name] = entryPath.split(/[\\/]/);
	return root === examplesRoot && isPrivateExample(name);
}

function skipReason(entryPath) {
	if (hasBannedSegment(entryPath)) {
		return "it contains an excluded directory segment";
	}
	if (hasBannedFileName(entryPath)) {
		return `${path.basename(entryPath)} is not allowed`;
	}
	if (isPrivatePath(entryPath)) {
		return "it is a private example";
	}
	return null;
}

function flattenName(entryPath) {
	return entryPath.split(/[\\/]/).join("__");
}

async function listFiles(relativeDir) {
	const files = [];
	const entries = await fsp.readdir(path.resolve(projectRoot, relativeDir), {
		withFileTypes: true,
	});
	for (const entry of entries) {
		if (entry.name.startsWith(".")) {
			continue;
		}
		const childPath = path.join(relativeDir, entry.name);
		if (skipReason(childPath)) {
			continue;
		}
		if (entry.isDirectory()) {
			files.push(...(await listFiles(childPath)));
		} else if (entry.isFile() && isAllowedFile(childPath)) {
			files.push(childPath);
		}
	}
	return files;
}

async function copyEntry(entryPath, outputRoot) {
	const reason = skipReason(entryPath);
	if (reason) {
		console.warn(`Skipping "${entryPath}" because ${reason}.`);
		return [];
	}

	const source = path.resolve(projectRoot, entryPath);
	const stats = await fsp.stat(source);
	const files = stats.isDirectory() ? await listFiles(entryPath) : [entryPath];

	if (stats.isFile() && !isAllowedFile(entryPath)) {
		console.warn(`Skipping "${entryPath}" because its file type is not bundled.`);
		return [];
	}

	const written = [];
	for (const file of files) {
		const content = await fsp.readFile(path.resolve(projectRoot, file), "utf8");
		const outName = flattenName(file);
		const destination = path.resolve(projectRoot, outputRoot, outName);
		await fsp.mkdir(path.dirname(destination), { recursive: true });
		await fsp.writeFile(
			destination,
			file.endsWith(".md") ? stripPrivateExampleLines(content) : content,
			"utf8",
		);
		written.push(outName);
	}
	return written;
}

function fileSortKey(relativePath) {
	const base = path.basename(relativePath);
	if (relativePath === "manifest.json") return `0 ${relativePath}`;
	if (/^main\.[cm]?[jt]sx?$/.test(relativePath)) return `1 ${relativePath}`;
	if (relativePath.startsWith("src/")) return `2 ${relativePath}`;
	if (base.endsWith(".md")) return `3 ${relativePath}`;
	return `4 ${relativePath}`;
}

function describeFeatures(manifest, files) {
	const config = manifest.config || {};
	const features = capabilityLabels
		.filter(([key]) => {
			const value = config[key];
			if (Array.isArray(value)) return value.length > 0;
			if (value && typeof value === "object") return Object.keys(value).length > 0;
			return value === true || (typeof value === "string" && value.trim() !== "");
		})
		.map(([, label]) => label);
	if (files.some((file) => /\.tsx?$/.test(file))) {
		features.unshift("TypeScript");
	}
	const fieldTypes = new Set();
	for (const field of config.settings || []) fieldTypes.add(field.type);
	for (const action of config.actions || []) {
		for (const field of action.fields || []) fieldTypes.add(field.type);
	}
	fieldTypes.delete(undefined);
	return { features, fieldTypes: [...fieldTypes].sort() };
}

async function loadExamples() {
	const entries = await fsp.readdir(path.resolve(projectRoot, examplesRoot), {
		withFileTypes: true,
	});
	const examples = [];
	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
		if (isPrivateExample(entry.name)) continue;
		const dir = path.join(examplesRoot, entry.name);
		const manifestPath = path.resolve(projectRoot, dir, "manifest.json");
		let manifest;
		try {
			manifest = JSON.parse(await fsp.readFile(manifestPath, "utf8"));
		} catch {
			console.warn(`Skipping "${dir}" because it has no readable manifest.json.`);
			continue;
		}
		const files = (await listFiles(dir))
			.map((file) => path.relative(dir, file).replace(/\\/g, "/"))
			.sort((a, b) => fileSortKey(a).localeCompare(fileSortKey(b)));
		examples.push({
			name: entry.name,
			dir: dir.replace(/\\/g, "/"),
			manifest,
			files,
			...describeFeatures(manifest, files),
		});
	}
	return examples.sort((a, b) => a.name.localeCompare(b.name));
}

function assignBundles(examples) {
	const fallback = EXAMPLE_BUNDLES.find((bundle) => bundle.fallback);
	const byBundle = new Map(EXAMPLE_BUNDLES.map((bundle) => [bundle.slug, []]));
	for (const example of examples) {
		const bundle =
			EXAMPLE_BUNDLES.find((entry) => entry.examples.includes(example.name)) ||
			EXAMPLE_BUNDLES.find((entry) =>
				entry.categories.includes(example.manifest.category),
			) ||
			fallback;
		byBundle.get(bundle.slug).push(example);
	}
	return EXAMPLE_BUNDLES.map((bundle) => ({
		...bundle,
		outFile: `examples__${bundle.slug}.md`,
		members: byBundle.get(bundle.slug),
	})).filter((bundle) => bundle.members.length > 0);
}

function tableCell(value) {
	return String(value || "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

async function renderBundle(bundle) {
	const lines = [
		`# Lumia Plugin Examples: ${bundle.title}`,
		"",
		`Use these examples for: ${bundle.useWhen}`,
		"",
		"## Index",
		"",
		"| Example | What it does | Shows | Field types |",
		"| --- | --- | --- | --- |",
		...bundle.members.map(
			(example) =>
				`| \`${example.name}\` (${tableCell(example.manifest.name)}) | ${tableCell(example.manifest.description)} | ${tableCell(example.features.join(", "))} | ${tableCell(example.fieldTypes.join(", "))} |`,
		),
		"",
	];
	for (const example of bundle.members) {
		lines.push(`## Example: ${example.name}`, "");
		lines.push(
			`Source folder \`${example.dir}\`, category \`${example.manifest.category || "unknown"}\`. ${example.manifest.description || ""}`.trim(),
			"",
		);
		for (const file of example.files) {
			const content = await fsp.readFile(
				path.resolve(projectRoot, example.dir, file),
				"utf8",
			);
			const language = fenceLanguages[path.extname(file).toLowerCase()] || "";
			lines.push(`### ${example.name}/${file}`, "", codeFence(content, language), "");
		}
	}
	return lines.join("\n");
}

function renderExampleIndex(bundles) {
	const rows = bundles.flatMap((bundle) =>
		bundle.members.map(
			(example) =>
				`| \`${example.name}\` | \`${bundle.outFile}\` | ${tableCell(example.manifest.description)} | ${tableCell(example.features.join(", "))} |`,
		),
	);
	return [
		"## Example Index",
		"",
		"Each example's full source (manifest, entry file, tutorials, translations) lives in the listed knowledge file.",
		"",
		...bundles.map((bundle) => `- \`${bundle.outFile}\`: ${bundle.useWhen}`),
		"",
		"| Example | Knowledge file | What it does | Shows |",
		"| --- | --- | --- | --- |",
		...rows,
	].join("\n");
}

async function assertNoPrivateContent(relativePaths) {
	const leaks = [];
	for (const relativePath of relativePaths) {
		const content = await fsp.readFile(path.resolve(projectRoot, relativePath), "utf8");
		const mentions = findPrivateExampleMentions(content);
		if (mentions.length > 0) {
			leaks.push(`${relativePath}: ${mentions.join(", ")}`);
		}
	}
	if (leaks.length > 0) {
		throw new Error(
			`Private examples (${PRIVATE_EXAMPLES.join(", ")}) leaked into generated output:\n${leaks.join("\n")}`,
		);
	}
}

async function main() {
	const options = parseArgs(process.argv);
	const outputPath = path.resolve(projectRoot, options.out);

	await fsp.rm(outputPath, { recursive: true, force: true });
	await fsp.mkdir(outputPath, { recursive: true });

	const { sections, outputs } = await writeInstructionOutputs();

	const packFiles = [];
	for (const entry of [...defaultEntries, ...options.extraEntries]) {
		const normalized = entry.replace(/\\/g, "/");
		await fsp.access(path.resolve(projectRoot, normalized));
		packFiles.push(...(await copyEntry(normalized, options.out)));
	}

	const bundles = assignBundles(await loadExamples());
	for (const bundle of bundles) {
		await fsp.writeFile(
			path.resolve(outputPath, bundle.outFile),
			await renderBundle(bundle),
			"utf8",
		);
		packFiles.push(bundle.outFile);
		console.log(
			`Bundled ${bundle.members.map((example) => example.name).join(", ")} into ${bundle.outFile}`,
		);
	}

	await fsp.writeFile(
		path.resolve(outputPath, rulesKnowledgeFile),
		buildRulesKnowledge(sections, renderExampleIndex(bundles)),
		"utf8",
	);
	packFiles.push(rulesKnowledgeFile);

	await assertNoPrivateContent([
		...packFiles.map((file) => path.join(options.out, file)),
		...outputs.map(([relativePath]) => relativePath),
	]);

	if (packFiles.length > GPT_KNOWLEDGE_FILE_LIMIT) {
		throw new Error(
			`Knowledge pack has ${packFiles.length} files; a custom GPT accepts at most ${GPT_KNOWLEDGE_FILE_LIMIT}.`,
		);
	}

	console.log(
		`Knowledge pack copied to ${path.relative(projectRoot, outputPath)} (${packFiles.length}/${GPT_KNOWLEDGE_FILE_LIMIT} GPT knowledge files)`,
	);
}

main().catch((err) => {
	console.error(err.message);
	process.exitCode = 1;
});
