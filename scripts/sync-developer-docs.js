#!/usr/bin/env node

/**
 * Sync core SDK docs into the Developer-Docs plugin-sdk section so
 * Plugin-SDK stays the source of truth and we avoid manual copy/paste.
 */

const fsp = require("node:fs/promises");
const path = require("node:path");
const typescript = require("typescript");

const projectRoot = path.resolve(__dirname, "..");

const defaultTarget = path.resolve(
	projectRoot,
	"..",
	"Developer-Docs",
	"docs",
	"plugin-sdk",
);

const docMappings = [
	{
		source: "README.md",
		target: "overview.md",
		transform: transformOverview,
	},
	{
		source: "docs/getting-started.md",
		target: "getting-started.md",
		transform: transformPluginSdkDoc,
	},
	{
		source: "docs/manifest-guide.md",
		target: "manifest-guide.md",
		transform: transformPluginSdkDoc,
	},
	{
		source: "docs/api-reference.md",
		target: "api-reference.md",
		transform: transformPluginSdkDoc,
	},
	{
		source: "docs/field-types-reference.md",
		target: "field-types-reference.md",
		transform: transformPluginSdkDoc,
	},
];

const assetMappings = [
	{
		source: "docs/lumiaplugin-banner.png",
		target: "lumiaplugin-banner.png",
	},
];

const defaultPrefixes = {
	"overview.md": "---\ntitle: Overview\nsidebar_position: 1\n---\n\n",
	"overview.mdx": "---\ntitle: Overview\nsidebar_position: 1\n---\n\n",
	"getting-started.md": "---\nsidebar_position: 2\n---\n\n",
	"getting-started.mdx": "---\nsidebar_position: 2\n---\n\n",
	"manifest-guide.md": "---\nsidebar_position: 3\n---\n\n",
	"manifest-guide.mdx": "---\nsidebar_position: 3\n---\n\n",
	"api-reference.md": "---\nsidebar_position: 4\n---\n\n",
	"api-reference.mdx": "---\nsidebar_position: 4\n---\n\n",
	"field-types-reference.md": "---\nsidebar_position: 5\n---\n\n",
	"field-types-reference.mdx": "---\nsidebar_position: 5\n---\n\n",
};

const tabsImport = 'import Tabs from "@theme/Tabs";';
const tabItemImport = 'import TabItem from "@theme/TabItem";';
const examplesSourceRoot = path.resolve(projectRoot, "examples");
const examplesSourceBaseUrl =
	"https://github.com/lumiastream/Plugin-SDK/tree/main/examples";
const excludedExampleFolders = new Set(["typescript_plugin"]);
const generatedExampleMarker = "<!-- GENERATED: sdk-example-doc -->";
const generatedExamplesIndexMarker = "<!-- GENERATED: sdk-examples-index -->";

function parseArgs(argv) {
	const args = argv.slice(2);
	let target = defaultTarget;
	let dryRun = false;
	let codeTabs = false;

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === "--target") {
			if (!args[i + 1]) {
				throw new Error("Expected a path after --target");
			}
			target = path.resolve(process.cwd(), args[i + 1]);
			i += 1;
			continue;
		}
		if (arg === "--dry-run") {
			dryRun = true;
			continue;
		}
		if (arg === "--code-tabs") {
			codeTabs = true;
			continue;
		}
		if (arg === "--no-code-tabs") {
			codeTabs = false;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}

	return { target, dryRun, codeTabs };
}

function stripFrontMatter(content) {
	if (!content.startsWith("---\n")) {
		return content;
	}

	const markerIndex = content.indexOf("\n---\n", 4);
	if (markerIndex === -1) {
		return content;
	}

	return content.slice(markerIndex + 5);
}

function extractPrefix(content) {
	const lines = content.split(/\r?\n/);
	let index = 0;

	if (lines[0] === "---") {
		index = 1;
		while (index < lines.length && lines[index] !== "---") {
			index += 1;
		}
		if (index < lines.length) {
			index += 1;
		}
		while (index < lines.length && lines[index].trim() === "") {
			index += 1;
		}
	}

	let importIndex = index;
	while (importIndex < lines.length) {
		const line = lines[importIndex].trim();
		if (line === "" || line.startsWith("import ")) {
			importIndex += 1;
			continue;
		}
		break;
	}

	if (importIndex === 0) {
		return "";
	}

	return `${lines.slice(0, importIndex).join("\n").trimEnd()}\n\n`;
}

function normalizeNewline(content) {
	return `${content.replace(/\r\n/g, "\n").replace(/\s+$/g, "")}\n`;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripMarkdownExtensionLinks(content) {
	return content.replace(
		/\]\(((?:\.\/|\.\.\/)[^)#?]+)\.md((?:[#?][^)]+)?)\)/g,
		"]($1$2)",
	);
}

function getDefaultPrefixForTarget(targetFileName) {
	if (defaultPrefixes[targetFileName]) {
		return defaultPrefixes[targetFileName];
	}

	const ext = path.extname(targetFileName);
	if (!ext) {
		return "";
	}

	const fallbackFileName = `${targetFileName.slice(0, -ext.length)}.md`;
	return defaultPrefixes[fallbackFileName] || "";
}

function normalizeInlineWhitespace(value) {
	return String(value || "").replace(/\s+/g, " ").trim();
}

function yamlQuote(value) {
	return JSON.stringify(String(value ?? ""));
}

function toKebabCase(value) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-+/g, "-");
}

function humanizeExampleName(exampleFolderName) {
	return exampleFolderName
		.replace(/[_-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function stripLeadingMarkdownHeading(content) {
	return content.replace(/^\s*#\s+[^\n]+\n+/, "");
}

function rewriteRelativeMarkdownLinks(content, baseUrl) {
	return content.replace(/(!?\[[^\]]*])\(([^)]+)\)/g, (match, label, href) => {
		const target = href.trim();
		if (
			target.length === 0 ||
			target.startsWith("#") ||
			/^https?:\/\//i.test(target) ||
			target.startsWith("mailto:") ||
			target.startsWith("data:") ||
			target.startsWith("<")
		) {
			return match;
		}

		try {
			const absoluteUrl = new URL(target, `${baseUrl}/`).toString();
			return `${label}(${absoluteUrl})`;
		} catch {
			return match;
		}
	});
}

function collectPreferredExampleFiles(fileNames) {
	const fileSet = new Set(fileNames);
	const preferred = [];

	for (const name of [
		"manifest.json",
		"main.js",
		"main.ts",
		"src/main.ts",
		"package.json",
		"README.md",
	]) {
		if (fileSet.has(name)) {
			preferred.push(name);
		}
	}

	for (const fileName of fileNames) {
		if (!fileName.endsWith(".md")) {
			continue;
		}
		if (fileName.toLowerCase() === "readme.md") {
			continue;
		}
		if (!preferred.includes(fileName)) {
			preferred.push(fileName);
		}
	}

	return preferred;
}

function buildExamplesIndexContent(examples) {
	const lines = [
		"---",
		"title: Examples",
		"---",
		"",
		generatedExamplesIndexMarker,
		"",
		"Browse the plugin SDK examples:",
		"",
	];

	for (const example of examples) {
		const suffix = example.description ? ` - ${example.description}` : "";
		lines.push(`- [${example.displayName}](./${example.slug})${suffix}`);
	}

	return lines.join("\n");
}

function buildExamplePageContent(example, options) {
	let readmeContent = example.readme;
	let readmeUsesTabs = false;

	if (readmeContent && options.codeTabs) {
		const converted = convertCodeBlocksToLanguageTabs(readmeContent);
		readmeContent = converted.content;
		readmeUsesTabs = converted.usedTabs;
	}

	const imports = readmeUsesTabs
		? `${tabsImport}\n${tabItemImport}\n\n`
		: "";

	const lines = [
		"---",
		`sidebar_position: ${example.sidebarPosition}`,
		`title: ${yamlQuote(example.pageTitle)}`,
		"---",
		"",
	];

	if (imports) {
		lines.push(imports.trimEnd());
		lines.push("");
	}

	lines.push(generatedExampleMarker);
	lines.push("");
	lines.push(`Source: ${example.sourceUrl}`);
	lines.push("");
	lines.push(
		example.description || "No description was provided in this example manifest.",
	);
	lines.push("");
	lines.push("## Quick Stats");
	lines.push("");
	lines.push("| Key | Value |");
	lines.push("| --- | --- |");
	lines.push(`| Folder | \`examples/${example.folderName}\` |`);
	lines.push(`| Plugin ID | \`${example.manifest.id || "-"}\` |`);
	lines.push(`| Category | \`${example.manifest.category || "-"}\` |`);
	lines.push(`| Lumia Version | \`${example.manifest.lumiaVersion || "-"}\` |`);
	lines.push(`| Settings | ${example.settingsCount} |`);
	lines.push(`| Actions | ${example.actionsCount} |`);
	lines.push(`| Variables | ${example.variablesCount} |`);
	lines.push(`| Alerts | ${example.alertsCount} |`);
	lines.push("");
	lines.push("## Key Files");
	lines.push("");

	if (example.keyFiles.length > 0) {
		for (const fileName of example.keyFiles) {
			lines.push(`- \`${fileName}\``);
		}
	} else {
		lines.push("- No key files detected.");
	}

	lines.push("");
	lines.push("## README");
	lines.push("");

	if (readmeContent) {
		lines.push(readmeContent.trim());
	} else {
		lines.push("_This example does not currently include a README.md file._");
	}

	return {
		content: lines.join("\n"),
		usedTabs: readmeUsesTabs,
	};
}

function transpileTypeScriptToJavaScript(code) {
	const result = typescript.transpileModule(code, {
		reportDiagnostics: true,
		compilerOptions: {
			target: typescript.ScriptTarget.ES2022,
			module: typescript.ModuleKind.ESNext,
			removeComments: false,
			jsx: typescript.JsxEmit.Preserve,
		},
	});

	const hasErrors = (result.diagnostics || []).some(
		(diag) => diag.category === typescript.DiagnosticCategory.Error,
	);

	return { code: result.outputText.trimEnd(), hasErrors };
}

function hasMeaningfulJavaScript(code) {
	const stripped = code
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/^\s*\/\/.*$/gm, "")
		.replace(/^\s*["']use strict["'];?\s*$/gm, "")
		.replace(/^\s*export\s*\{\s*\};?\s*$/gm, "")
		.replace(/^\s*;+\s*$/gm, "")
		.trim();

	return stripped.length > 0;
}

function looksLikeMalformedFencedCode(code) {
	// Guard against accidentally swallowing markdown headings into a fence.
	return /(^|\n)#{1,6}\s+[^\n]+/m.test(code);
}

function buildLanguageTabs(jsCode, tsCode) {
	const normalizedJs = jsCode.trimEnd();
	const normalizedTs = tsCode.trimEnd();

	return [
		'<Tabs groupId="sdk-code-language" defaultValue="javascript">',
		'<TabItem value="javascript" label="JavaScript">',
		"",
		"```js",
		normalizedJs,
		"```",
		"",
		"</TabItem>",
		'<TabItem value="typescript" label="TypeScript">',
		"",
		"```ts",
		normalizedTs,
		"```",
		"",
		"</TabItem>",
		"</Tabs>",
	].join("\n");
}

function convertCodeBlocksToLanguageTabs(content) {
	const lines = content.split("\n");
	const out = [];
	let usedTabs = false;

	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const match = line.match(/^```([a-zA-Z0-9_-]+)(.*)$/);
		if (!match) {
			out.push(line);
			continue;
		}

		const rawLang = match[1].toLowerCase();
		const meta = match[2] ?? "";
		const normalizedLang =
			rawLang === "typescript"
				? "ts"
				: rawLang === "javascript"
					? "js"
					: rawLang;

		const block = [];
		let closed = false;
		for (i += 1; i < lines.length; i += 1) {
			if (lines[i].startsWith("```")) {
				closed = true;
				break;
			}
			block.push(lines[i]);
		}

		if (!closed) {
			out.push(line);
			out.push(...block);
			break;
		}

		// Skip conversion when the fence has metadata to avoid losing attributes.
		if (meta.trim().length > 0) {
			out.push(line);
			out.push(...block);
			out.push("```");
			continue;
		}

		const code = block.join("\n");

		if (looksLikeMalformedFencedCode(code)) {
			out.push(line);
			out.push(...block);
			out.push("```");
			continue;
		}

		if (normalizedLang === "js") {
			out.push(buildLanguageTabs(code, code));
			usedTabs = true;
			continue;
		}

		if (normalizedLang === "ts") {
			const transpiled = transpileTypeScriptToJavaScript(code);
			if (transpiled.hasErrors || !hasMeaningfulJavaScript(transpiled.code)) {
				out.push("```ts");
				out.push(...block);
				out.push("```");
				continue;
			}

			out.push(buildLanguageTabs(transpiled.code, code));
			usedTabs = true;
			continue;
		}

		out.push(line);
		out.push(...block);
		out.push("```");
	}

	return { content: out.join("\n"), usedTabs };
}

function ensureTabsImports(prefix, needsTabs) {
	let out = prefix
		.replace(new RegExp(`^${escapeRegExp(tabsImport)}\\n?`, "m"), "")
		.replace(new RegExp(`^${escapeRegExp(tabItemImport)}\\n?`, "m"), "")
		.replace(/\n{3,}/g, "\n\n");

	if (!needsTabs) {
		return out;
	}

	const missing = [];

	if (!out.includes(tabsImport)) {
		missing.push(tabsImport);
	}
	if (!out.includes(tabItemImport)) {
		missing.push(tabItemImport);
	}

	if (missing.length === 0) {
		return out;
	}

	const base = out.trimEnd();
	out = `${base}\n${missing.join("\n")}\n\n`;
	return out;
}

function transformOverview(content, options) {
	let out = stripFrontMatter(content);

	// SDK README links point through ./docs; the docs site page is already in plugin-sdk/.
	out = out.replace(/\]\((?:\.\/)?docs\//g, "](./");
	out = out.replace(/\]\(\.\.\/examples\/\)/g, "](./examples)");
	out = stripMarkdownExtensionLinks(out);
	out = out.replace(
		/\]\((?:\.\/)?LICENSE\)/g,
		"](https://github.com/lumiastream/Plugin-SDK/blob/main/LICENSE)",
	);

	if (!options.codeTabs) {
		return { content: out, usedTabs: false };
	}

	const converted = convertCodeBlocksToLanguageTabs(out);
	return { content: converted.content, usedTabs: converted.usedTabs };
}

function transformPluginSdkDoc(content, options) {
	let out = stripFrontMatter(content);
	out = out.replace(/\]\(\.\.\/examples\/\)/g, "](./examples)");
	out = stripMarkdownExtensionLinks(out);

	if (!options.codeTabs) {
		return { content: out, usedTabs: false };
	}

	const converted = convertCodeBlocksToLanguageTabs(out);
	return { content: converted.content, usedTabs: converted.usedTabs };
}

async function readIfExists(filePath) {
	try {
		return await fsp.readFile(filePath, "utf8");
	} catch (error) {
		if (error && error.code === "ENOENT") {
			return null;
		}
		throw error;
	}
}

async function readJson(filePath) {
	const raw = await fsp.readFile(filePath, "utf8");
	try {
		return JSON.parse(raw);
	} catch (error) {
		throw new Error(
			`Failed to parse JSON in ${path.relative(projectRoot, filePath)}: ${error.message}`,
		);
	}
}

async function syncDocs(targetRoot, dryRun, options) {
	const results = [];

	for (const mapping of docMappings) {
		const sourcePath = path.resolve(projectRoot, mapping.source);

		const sourceRaw = await fsp.readFile(sourcePath, "utf8");
		const transformedResult = mapping.transform(sourceRaw, options);
		const transformedContent =
			typeof transformedResult === "string"
				? transformedResult
				: transformedResult.content;
		const usedTabs =
			typeof transformedResult === "string"
				? false
				: Boolean(transformedResult.usedTabs);
		const targetStem = mapping.target.replace(/\.mdx?$/i, "");
		const preferredTargetFileName = `${targetStem}${usedTabs ? ".mdx" : ".md"}`;
		const alternateTargetFileName = `${targetStem}${usedTabs ? ".md" : ".mdx"}`;
		const targetPath = path.resolve(targetRoot, preferredTargetFileName);
		const alternatePath = path.resolve(targetRoot, alternateTargetFileName);

		const [existing, alternateExisting] = await Promise.all([
			readIfExists(targetPath),
			readIfExists(alternatePath),
		]);
		const basePrefix =
			extractPrefix(existing ?? alternateExisting ?? "") ||
			getDefaultPrefixForTarget(preferredTargetFileName);
		const prefix = ensureTabsImports(basePrefix, usedTabs);
		const next = normalizeNewline(`${prefix}${transformedContent.trimStart()}`);
		const current = existing ? normalizeNewline(existing) : null;
		const changed = current !== next;

		results.push({
			kind: "doc",
			target: path.relative(projectRoot, targetPath),
			changed,
			status: changed && dryRun ? "would-update" : undefined,
		});

		if (changed && !dryRun) {
			await fsp.mkdir(path.dirname(targetPath), { recursive: true });
			await fsp.writeFile(targetPath, next, "utf8");
		}

		if (alternateExisting !== null) {
			results.push({
				kind: "doc",
				target: path.relative(projectRoot, alternatePath),
				changed: true,
				status: dryRun ? "would-remove" : "removed",
			});

			if (!dryRun) {
				await fsp.unlink(alternatePath);
			}
		}
	}

	return results;
}

async function syncAssets(targetRoot, dryRun) {
	const results = [];

	for (const mapping of assetMappings) {
		const sourcePath = path.resolve(projectRoot, mapping.source);
		const targetPath = path.resolve(targetRoot, mapping.target);
		let changed = true;

		try {
			const [sourceStat, targetStat] = await Promise.all([
				fsp.stat(sourcePath),
				fsp.stat(targetPath),
			]);
			changed =
				sourceStat.size !== targetStat.size ||
				sourceStat.mtimeMs > targetStat.mtimeMs;
		} catch (error) {
			if (!error || error.code !== "ENOENT") {
				throw error;
			}
			changed = true;
		}

		results.push({
			kind: "asset",
			target: path.relative(projectRoot, targetPath),
			changed,
		});

		if (!changed || dryRun) {
			continue;
		}

		await fsp.mkdir(path.dirname(targetPath), { recursive: true });
		await fsp.copyFile(sourcePath, targetPath);
	}

	return results;
}

async function collectSdkExamples(options) {
	const entries = await fsp.readdir(examplesSourceRoot, { withFileTypes: true });
	const examples = [];

	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name.startsWith(".")) {
			continue;
		}
		if (excludedExampleFolders.has(entry.name)) {
			continue;
		}

		const exampleRoot = path.resolve(examplesSourceRoot, entry.name);
		const manifestPath = path.resolve(exampleRoot, "manifest.json");
		const manifestRaw = await readIfExists(manifestPath);
		if (!manifestRaw) {
			continue;
		}

		const manifest = await readJson(manifestPath);
		const folderName = entry.name;
		const slug = toKebabCase(folderName);
		const displayName = normalizeInlineWhitespace(
			manifest.name || humanizeExampleName(folderName),
		);
		const pageTitle = /example/i.test(displayName)
			? displayName
			: `${displayName} Example`;
		const description = normalizeInlineWhitespace(manifest.description);
		const sourceUrl = `${examplesSourceBaseUrl}/${folderName}`;
		const rootFiles = (await fsp.readdir(exampleRoot, { withFileTypes: true }))
			.filter((item) => item.isFile() && !item.name.startsWith("."))
			.map((item) => item.name)
			.sort((a, b) => a.localeCompare(b));

		const readmePath = path.resolve(exampleRoot, "README.md");
		const readmeRaw = await readIfExists(readmePath);
		let readme = null;
		if (readmeRaw) {
			readme = stripLeadingMarkdownHeading(readmeRaw).trim();
			readme = rewriteRelativeMarkdownLinks(readme, sourceUrl);
		}

		const keyFiles = collectPreferredExampleFiles(rootFiles);
		const srcMainPath = path.resolve(exampleRoot, "src", "main.ts");
		try {
			const srcMainStat = await fsp.stat(srcMainPath);
			if (srcMainStat.isFile() && !keyFiles.includes("src/main.ts")) {
				keyFiles.splice(Math.min(3, keyFiles.length), 0, "src/main.ts");
			}
		} catch (error) {
			if (!error || error.code !== "ENOENT") {
				throw error;
			}
		}

		const config = manifest.config || {};
		const settingsCount = Array.isArray(config.settings)
			? config.settings.length
			: 0;
		const actionsCount = Array.isArray(config.actions) ? config.actions.length : 0;
		const variablesCount = Array.isArray(config.variables)
			? config.variables.length
			: 0;
		const alertsCount = Array.isArray(config.alerts) ? config.alerts.length : 0;

		examples.push({
			folderName,
			slug,
			displayName,
			pageTitle,
			description,
			manifest,
			sourceUrl,
			keyFiles,
			readme,
			settingsCount,
			actionsCount,
			variablesCount,
			alertsCount,
			sidebarPosition: 0,
		});
	}

	examples.sort((a, b) => a.displayName.localeCompare(b.displayName));
	examples.forEach((example, index) => {
		example.sidebarPosition = index + 1;
		const pageResult = buildExamplePageContent(example, options);
		example.pageContent = pageResult.content;
		example.pageUsesTabs = pageResult.usedTabs;
	});

	return examples;
}

async function syncExamples(targetRoot, dryRun, options) {
	const results = [];
	const targetExamplesRoot = path.resolve(targetRoot, "examples");
	const examples = await collectSdkExamples(options);
	const expectedDocFiles = new Set(["index.md"]);

	const indexPath = path.resolve(targetExamplesRoot, "index.md");
	const indexNext = normalizeNewline(buildExamplesIndexContent(examples));
	const indexCurrent = await readIfExists(indexPath);
	const indexChanged =
		(indexCurrent ? normalizeNewline(indexCurrent) : null) !== indexNext;
	results.push({
		kind: "example",
		target: path.relative(projectRoot, indexPath),
		changed: indexChanged,
		status: indexChanged && dryRun ? "would-update" : undefined,
	});

	if (indexChanged && !dryRun) {
		await fsp.mkdir(path.dirname(indexPath), { recursive: true });
		await fsp.writeFile(indexPath, indexNext, "utf8");
	}

	for (const example of examples) {
		const preferredExt = example.pageUsesTabs ? ".mdx" : ".md";
		const alternateExt = preferredExt === ".mdx" ? ".md" : ".mdx";
		const targetFileName = `${example.slug}${preferredExt}`;
		const alternateFileName = `${example.slug}${alternateExt}`;
		const targetPath = path.resolve(targetExamplesRoot, targetFileName);
		const alternatePath = path.resolve(targetExamplesRoot, alternateFileName);
		expectedDocFiles.add(targetFileName);
		const next = normalizeNewline(example.pageContent);
		const [currentRaw, alternateExisting] = await Promise.all([
			readIfExists(targetPath),
			readIfExists(alternatePath),
		]);
		const current = currentRaw ? normalizeNewline(currentRaw) : null;
		const changed = current !== next;

		results.push({
			kind: "example",
			target: path.relative(projectRoot, targetPath),
			changed,
			status: changed && dryRun ? "would-update" : undefined,
		});

		if (changed && !dryRun) {
			await fsp.mkdir(path.dirname(targetPath), { recursive: true });
			await fsp.writeFile(targetPath, next, "utf8");
		}

		if (alternateExisting !== null) {
			results.push({
				kind: "example",
				target: path.relative(projectRoot, alternatePath),
				changed: true,
				status: dryRun ? "would-remove" : "removed",
			});

			if (!dryRun) {
				await fsp.unlink(alternatePath);
			}
		}
	}

	let existing = [];
	try {
		existing = await fsp.readdir(targetExamplesRoot, { withFileTypes: true });
	} catch (error) {
		if (!error || error.code !== "ENOENT") {
			throw error;
		}
		existing = [];
	}

	for (const entry of existing) {
		if (!entry.isFile()) {
			continue;
		}

		const fileName = entry.name;
		if (fileName === "_category_.json") {
			continue;
		}
		if (!fileName.toLowerCase().endsWith(".md")) {
			if (!fileName.toLowerCase().endsWith(".mdx")) {
				continue;
			}
		}
		if (expectedDocFiles.has(fileName)) {
			continue;
		}

		const stalePath = path.resolve(targetExamplesRoot, fileName);
		results.push({
			kind: "example",
			target: path.relative(projectRoot, stalePath),
			changed: true,
			status: dryRun ? "would-remove" : "removed",
		});

		if (!dryRun) {
			await fsp.unlink(stalePath);
		}
	}

	return results;
}

async function main() {
	const { target, dryRun, codeTabs } = parseArgs(process.argv);

	await fsp.mkdir(target, { recursive: true });

	const [docResults, assetResults, exampleResults] = await Promise.all([
		syncDocs(target, dryRun, { codeTabs }),
		syncAssets(target, dryRun),
		syncExamples(target, dryRun, { codeTabs }),
	]);

	const allResults = [...docResults, ...assetResults, ...exampleResults];
	const changed = allResults.filter((item) => item.changed);

	console.log(
		`${dryRun ? "Dry run" : "Sync"} complete. ${changed.length}/${allResults.length} file(s) ${dryRun ? "would change" : "changed"}.`,
	);

	for (const result of allResults) {
		const status =
			result.status ||
			(result.changed ? (dryRun ? "would-update" : "updated") : "unchanged");
		console.log(`${status} ${result.target}`);
	}
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
