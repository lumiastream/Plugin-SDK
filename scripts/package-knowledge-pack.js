#!/usr/bin/env node

/**
 * Helper script to collect the key Lumia Plugin SDK docs (and optional extras)
 * into a ready-to-upload folder for use as a Custom GPT knowledge pack.
 */

const fsp = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

const defaultEntries = [
	"README.md",
	"docs/getting-started.md",
	"docs/manifest-guide.md",
	"docs/api-reference.md",
	"docs/field-types-reference.md",
	"examples",
];

const outputDefault = "gpt-knowledge/lumia-plugin-sdk-docs";
const bannedSegments = new Set(["node_modules"]);
const bannedExtensions = new Set([
	".lumiaplugin",
	".png",
	".jpg",
	".jpeg",
	".gif",
	".mp4",
	".mov",
	".webp",
	".svg",
]);

const aggregatedRoots = new Map([
	[
		"examples",
		{
			outFile: "examples__bundle.md",
			title: "Lumia Plugin Examples",
			intro:
				"Combined source files from the `examples/` directory. Each section shows the original path followed by file contents.",
		},
	],
]);

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

function hasBannedExtension(entryPath) {
	return bannedExtensions.has(path.extname(entryPath).toLowerCase());
}

async function ensureEntry(entryPath) {
	const absolutePath = path.resolve(projectRoot, entryPath);
	await fsp.access(absolutePath);

	if (hasBannedSegment(entryPath)) {
		console.warn(
			`Skipping "${entryPath}" because node_modules content is not allowed.`,
		);
		return null;
	}

	if (hasBannedExtension(entryPath)) {
		console.warn(
			`Skipping "${entryPath}" because ${path.extname(entryPath)} files are not allowed.`,
		);
		return null;
	}

	return entryPath;
}

async function copyEntry(entryPath, outputRoot) {
	if (hasBannedSegment(entryPath)) {
		console.warn(
			`Skipping "${entryPath}" because node_modules content is not allowed.`,
		);
		return;
	}

	const source = path.resolve(projectRoot, entryPath);
	const destination = path.resolve(projectRoot, outputRoot, entryPath);
	const stats = await fsp.stat(source);

	if (stats.isDirectory()) {
		const children = await fsp.readdir(source, { withFileTypes: true });
		for (const child of children) {
			if (child.name.startsWith(".")) {
				continue;
			}

			const childPath = path.join(entryPath, child.name);
			if (hasBannedSegment(childPath) || hasBannedExtension(childPath)) {
				continue;
			}

			await copyEntry(childPath, outputRoot);
		}
		return;
	}

	if (!stats.isFile()) {
		throw new Error(`Skipping "${entryPath}" (not a file or directory).`);
	}

	if (hasBannedExtension(entryPath)) {
		console.warn(
			`Skipping "${entryPath}" because ${path.extname(entryPath)} files are not allowed.`,
		);
		return;
	}

	// Flatten directories by encoding their path in the filename.
	const flattenedName = entryPath.includes(path.sep)
		? entryPath.split(path.sep).join("__")
		: entryPath;

	const destinationPath = path.resolve(projectRoot, outputRoot, flattenedName);
	await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
	await fsp.copyFile(source, destinationPath);
}

async function bundleDirectory(rootRelativePath, outputRoot, bundleConfig) {
	const rootAbsolutePath = path.resolve(projectRoot, rootRelativePath);
	const sections = [];

	async function walk(currentRelativePath) {
		const absolutePath = path.resolve(projectRoot, currentRelativePath);
		const stats = await fsp.stat(absolutePath);

		if (stats.isDirectory()) {
			const entries = await fsp.readdir(absolutePath, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.name.startsWith(".")) {
					continue;
				}
				const nextRelative = path.join(currentRelativePath, entry.name);
				if (
					hasBannedSegment(nextRelative) ||
					hasBannedExtension(nextRelative)
				) {
					continue;
				}
				await walk(nextRelative);
			}
			return;
		}

		if (!stats.isFile()) {
			return;
		}

		if (hasBannedExtension(currentRelativePath)) {
			return;
		}

		const relFromRoot = path
			.relative(rootAbsolutePath, absolutePath)
			.replace(/\\/g, "/");
		const content = await fsp.readFile(absolutePath, "utf8");

		sections.push(
			`## ${relFromRoot || path.basename(rootAbsolutePath)}\n\n\`\`\`\n${content}\n\`\`\`\n`,
		);
	}

	await walk(rootRelativePath);

	if (sections.length === 0) {
		console.warn(
			`No bundle content found for "${rootRelativePath}" (all files may have been skipped).`,
		);
		return;
	}

	const bundleLines = [
		`# ${bundleConfig.title}`,
		"",
		bundleConfig.intro,
		"",
		...sections,
	];

	const bundlePath = path.resolve(
		projectRoot,
		outputRoot,
		bundleConfig.outFile,
	);
	await fsp.mkdir(path.dirname(bundlePath), { recursive: true });
	await fsp.writeFile(bundlePath, bundleLines.join("\n"), "utf8");
	console.log(
		`Bundled "${rootRelativePath}" into ${path.relative(projectRoot, bundlePath)}`,
	);
}

async function main() {
	const options = parseArgs(process.argv);

	const outputPath = path.resolve(projectRoot, options.out);
	const outputDir = path.dirname(outputPath);
	await fsp.mkdir(outputDir, { recursive: true });

	const allEntries = [...defaultEntries, ...options.extraEntries];

	await fsp.rm(outputPath, { recursive: true, force: true });
	await fsp.mkdir(outputPath, { recursive: true });

	const validatedEntries = [];
	for (const entry of allEntries) {
		const normalized = entry.replace(/\\/g, "/");
		const ensured = await ensureEntry(normalized);
		if (ensured) {
			validatedEntries.push(ensured);
		}
	}

	const bundledRootsHandled = new Set();

	for (const entry of validatedEntries) {
		const rootKey = entry.split(/[\\/]/)[0];
		const bundleConfig = aggregatedRoots.get(rootKey);

		if (bundleConfig) {
			if (!bundledRootsHandled.has(rootKey)) {
				await bundleDirectory(rootKey, options.out, bundleConfig);
				bundledRootsHandled.add(rootKey);
			}
			continue;
		}

		await copyEntry(entry, options.out);
	}

	const relativeOutput =
		path.relative(projectRoot, outputPath) || path.basename(outputPath);

	console.log(`Knowledge pack copied to ${relativeOutput}`);
}

main().catch((err) => {
	console.error(err.message);
	process.exitCode = 1;
});
