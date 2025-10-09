#!/usr/bin/env node
const path = require("path");
const fs = require("fs");

const TEMPLATE_DIR = path.resolve(__dirname, "..", "examples", "base-plugin");

function toSafeId(value) {
	const cleaned = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
	const safe = cleaned.replace(/__+/g, "_");
	return safe || "my_plugin";
}

function toDisplayName(id) {
	return id
		.split(/[_-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function printHelp() {
	console.log(
		`Scaffold a new Lumia Stream plugin directory using the showcase template.\n\nUsage: npx lumia-plugin create [target-directory]\n\nExamples:\n  npx lumia-plugin create ./plugins/my_plugin\n  npx lumia-plugin create my_awesome_plugin\n`
	);
}

async function ensureEmptyDir(targetDir) {
	try {
		const stats = await fs.promises.stat(targetDir);
		if (!stats.isDirectory()) {
			throw new Error(
				`Path '${path.basename(
					targetDir
				)}' exists and is not a directory.\n   Tip: Choose a different name or remove the existing file.`
			);
		}
		const contents = await fs.promises.readdir(targetDir);
		if (contents.length > 0) {
			throw new Error(
				`Directory '${path.basename(
					targetDir
				)}' already exists and is not empty.\n   Tip: Use a different name or remove existing files first.`
			);
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

function ensureArray(value) {
	return Array.isArray(value) ? value : [];
}

async function updateManifest(manifestPath, pluginId, displayName) {
	const raw = await fs.promises.readFile(manifestPath, "utf8");
	const manifest = JSON.parse(raw);

	manifest.id = pluginId;
	manifest.name = displayName;
	manifest.description = manifest.description?.trim()
		? manifest.description
		: `Describe what ${displayName} does.`;
	manifest.longDescription = manifest.longDescription || "";
	manifest.repository = manifest.repository || "";
	manifest.website = manifest.website || "";
	manifest.email = manifest.email || "";
	manifest.icon = manifest.icon || "";
	manifest.screenshots = ensureArray(manifest.screenshots);
	manifest.changelog = manifest.changelog || "";
	manifest.keywords = ensureArray(manifest.keywords);

	if (!manifest.keywords.includes(pluginId)) {
		manifest.keywords.push(pluginId);
	}

	if (!manifest.main) {
		manifest.main = "main.js";
	}

	if (manifest.config && typeof manifest.config === "object") {
		const { settings, actions, variables } = manifest.config;

		const welcomeSetting = ensureArray(settings).find(
			(setting) => setting?.key === "welcomeMessage"
		);
		if (welcomeSetting) {
			welcomeSetting.defaultValue = `Hello from ${displayName}!`;
		}

		const logAction = ensureArray(actions).find(
			(action) => action?.type === "log_message"
		);
		if (logAction && Array.isArray(logAction.fields)) {
			const messageField = logAction.fields.find(
				(field) => field?.key === "message"
			);
			if (messageField) {
				messageField.defaultValue = `Hello from ${displayName}!`;
			}
		}

		for (const variable of ensureArray(variables)) {
			if (!variable || typeof variable !== "object") continue;
			if (variable.origin) {
				variable.origin = pluginId;
			}
			if (variable.name === "last_message" && "example" in variable) {
				variable.example = `Hello from ${displayName}!`;
			}
		}
	}

	await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}

async function updateMain(mainPath, pluginId, className, displayName) {
	let source = await fs.promises.readFile(mainPath, "utf8");
	source = source.replace(
		/class\s+ShowcasePluginTemplate\s+extends\s+Plugin/,
		`class ${className} extends Plugin`
	);
	source = source.replace(
		/module\.exports\s*=\s*ShowcasePluginTemplate;/,
		`module.exports = ${className};`
	);
	source = source.replace(
		/Hello from Showcase Plugin!/g,
		`Hello from ${displayName}!`
	);
	source = source.replace(/Showcase Plugin/g, displayName);
	source = source.replace(/showcase[-_]plugin/g, pluginId);
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

async function updateGettingStarted(gettingStartedPath, displayName) {
	if (!fs.existsSync(gettingStartedPath)) return;
	let content = await fs.promises.readFile(gettingStartedPath, "utf8");
	content = content.replace(
		/^# Getting Started with .*$/m,
		`# Getting Started with ${displayName}`
	);
	content = content.replace(/Showcase Plugin Template/g, displayName);
	await fs.promises.writeFile(gettingStartedPath, content);
}

async function main() {
	const args = process.argv.slice(2);
	if (args.includes("--help") || args.includes("-h")) {
		printHelp();
		return;
	}

	if (!fs.existsSync(TEMPLATE_DIR)) {
		console.error("✖ Template directory not found:", TEMPLATE_DIR);
		console.error("   Tip: Make sure lumia-plugin is properly installed.");
		process.exit(1);
	}

	const targetDir = path.resolve(args[0] || "my_plugin");
	const pluginId = toSafeId(path.basename(targetDir));
	const displayName = toDisplayName(pluginId) || "My Plugin";
	const className = displayName.replace(/[^a-zA-Z0-9]/g, "") || "MyPlugin";

	try {
		console.log("⏳ Creating plugin scaffold...\n");

		console.log("  📁 Creating directory...");
		await ensureEmptyDir(targetDir);

		console.log("  📋 Copying template files...");
		await copyTemplate(TEMPLATE_DIR, targetDir);

		console.log("  ✏️  Updating manifest.json...");
		await updateManifest(
			path.join(targetDir, "manifest.json"),
			pluginId,
			displayName
		);

		console.log("  ✏️  Updating main.js...");
		await updateMain(
			path.join(targetDir, "main.js"),
			pluginId,
			className,
			displayName
		);

		console.log("  ✏️  Updating package.json...");
		await updatePackageJson(
			path.join(targetDir, "package.json"),
			pluginId,
			displayName
		);

		console.log("  ✏️  Updating README.md...");
		await updateReadme(path.join(targetDir, "README.md"), displayName);

		console.log("  ✏️  Updating GETTING_STARTED.md...");
		await updateGettingStarted(
			path.join(targetDir, "GETTING_STARTED.md"),
			displayName
		);

		console.log("\n✅ Plugin scaffold created successfully!\n");
		console.log("📦 Created files:");
		console.log(`  - ${targetDir}/`);
		console.log("  - manifest.json");
		console.log("  - main.js");
		if (fs.existsSync(path.join(targetDir, "README.md"))) {
			console.log("  - README.md");
		}
		if (fs.existsSync(path.join(targetDir, "GETTING_STARTED.md"))) {
			console.log("  - GETTING_STARTED.md");
		}
		if (fs.existsSync(path.join(targetDir, "package.json"))) {
			console.log("  - package.json");
		}

		console.log("\n🚀 Next steps:");
		console.log(`  1. cd ${path.basename(targetDir)}`);
		console.log("  2. npm install");
		console.log("  3. Read GETTING_STARTED.md for a complete guide");
		console.log("  4. Edit manifest.json to configure your plugin");
		console.log("  5. Start coding in main.js");
		console.log("\n📖 Learn more: https://docs.lumiastream.com");
	} catch (error) {
		console.error(`\n✖ Failed to create plugin: ${error.message}`);
		process.exit(1);
	}
}

main();
