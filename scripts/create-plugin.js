#!/usr/bin/env node
const path = require("path");
const fs = require("fs");

const TEMPLATE_DIR = path.resolve(__dirname, "..", "examples", "base-plugin");

function toKebabCase(value) {
	return (
		value
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "my-plugin"
	);
}

function toDisplayName(id) {
	return id
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function printHelp() {
	console.log(`Scaffold a new Lumia Stream plugin directory using the base-plugin template.

Usage: npm run create:plugin -- [target-directory]

Examples:
  npm run create:plugin -- ./plugins/my-plugin
  npm run create:plugin            # uses ./my-plugin
`);
}

async function ensureEmptyDir(targetDir) {
	try {
		const stats = await fs.promises.stat(targetDir);
		if (!stats.isDirectory()) {
			throw new Error("Target path exists and is not a directory");
		}
		const contents = await fs.promises.readdir(targetDir);
		if (contents.length > 0) {
			throw new Error("Target directory must be empty");
		}
	} catch (error) {
		if (error.code === "ENOENT") {
			await fs.promises.mkdir(targetDir, { recursive: true });
			return;
		}
		throw error;
	}
}

async function copyTemplate(src, dest) {
	const stats = await fs.promises.stat(src);
	if (stats.isDirectory()) {
		await fs.promises.mkdir(dest, { recursive: true });
		const entries = await fs.promises.readdir(src);
		for (const entry of entries) {
			await copyTemplate(path.join(src, entry), path.join(dest, entry));
		}
	} else if (stats.isFile()) {
		await fs.promises.copyFile(src, dest);
	}
}

async function updateManifest(manifestPath, pluginId, displayName) {
	const raw = await fs.promises.readFile(manifestPath, "utf8");
	const manifest = JSON.parse(raw);

	manifest.id = pluginId;
	manifest.name = displayName;
	manifest.description = "Describe what your plugin does.";
	manifest.longDescription = manifest.longDescription || "";
	manifest.repository = manifest.repository || "";
	manifest.website = manifest.website || "";
	manifest.email = manifest.email || "";
	manifest.keywords = manifest.keywords || [];
	manifest.icon = manifest.icon || "";
	manifest.screenshots = manifest.screenshots || [];
	manifest.changelog = manifest.changelog || "";

	manifest.config = {
		settings: [],
		actions: [
			{
				type: "log_message",
				label: "Log Message",
				description: "Write a message to the Lumia log panel.",
				fields: [
					{
						key: "message",
						label: "Message",
						type: "text",
						defaultValue: `Hello from ${displayName}`,
					},
				],
			},
		],
		variables: [],
		alerts: [],
	};

	await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}

async function updateMain(mainPath, pluginId, className, displayName) {
	let source = await fs.promises.readFile(mainPath, "utf8");
	source = source.replace(
		/class\s+BasePluginTemplate\s+extends\s+Plugin/,
		`class ${className} extends Plugin`
	);
	source = source.replace(/\[base-plugin\]/g, `[${pluginId}]`);
	source = source.replace(/example_action/g, "log_message");
	source = source.replace(/Example Action/g, "Log Message");
	source = source.replace(
		/Hello from Base Plugin/g,
		`Hello from ${displayName}`
	);
	source = source.replace("Template plugin loaded", "Plugin loaded");
	source = source.replace("Template plugin unloaded", "Plugin unloaded");
	source = source.replace(
		/module\.exports\s*=\s*BasePluginTemplate;/,
		`module.exports = ${className};`
	);
	await fs.promises.writeFile(mainPath, source);
}

async function updatePackageJson(packagePath, pluginId, displayName) {
	if (!fs.existsSync(packagePath)) return;
	const pkg = JSON.parse(await fs.promises.readFile(packagePath, "utf8"));
	pkg.name = `lumia-plugin-${pluginId}`;
	pkg.description = pkg.description || `${displayName} for Lumia Stream`;
	await fs.promises.writeFile(packagePath, JSON.stringify(pkg, null, 2));
}

async function updateReadme(readmePath, displayName) {
	if (!fs.existsSync(readmePath)) return;
	let content = await fs.promises.readFile(readmePath, "utf8");
	content = content.replace(/^# .*$/m, `# ${displayName}`);
	await fs.promises.writeFile(readmePath, content);
}

async function main() {
	const args = process.argv.slice(2);
	if (args.includes("--help") || args.includes("-h")) {
		printHelp();
		return;
	}

	if (!fs.existsSync(TEMPLATE_DIR)) {
		console.error("✖ Template directory not found:", TEMPLATE_DIR);
		process.exit(1);
	}

	const targetDir = path.resolve(args[0] || "my-plugin");
	const pluginId = toKebabCase(path.basename(targetDir));
	const displayName = toDisplayName(pluginId) || "My Plugin";
	const className = displayName.replace(/[^a-zA-Z0-9]/g, "") || "MyPlugin";

	try {
		await ensureEmptyDir(targetDir);
		await copyTemplate(TEMPLATE_DIR, targetDir);

		await updateManifest(
			path.join(targetDir, "manifest.json"),
			pluginId,
			displayName
		);
		await updateMain(
			path.join(targetDir, "main.js"),
			pluginId,
			className,
			displayName
		);
		await updatePackageJson(
			path.join(targetDir, "package.json"),
			pluginId,
			displayName
		);
		await updateReadme(path.join(targetDir, "README.md"), displayName);

		console.log("✔ Plugin scaffold created");
		console.log(`  - directory: ${targetDir}`);
		console.log("  - manifest.json");
		console.log("  - main.js");
		if (fs.existsSync(path.join(targetDir, "README.md"))) {
			console.log("  - README.md");
		}
		if (fs.existsSync(path.join(targetDir, "package.json"))) {
			console.log("  - package.json");
		}
	} catch (error) {
		console.error(`✖ Failed to create plugin: ${error.message}`);
		process.exit(1);
	}
}

main();
