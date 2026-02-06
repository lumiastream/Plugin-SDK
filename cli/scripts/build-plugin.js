#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");
const {
	readManifest,
	validateManifest,
	collectFiles,
	createPluginArchive,
} = require("./utils");

function parseArgs() {
	const args = process.argv.slice(2);
	const options = { dir: process.cwd(), outFile: null, install: false };
	while (args.length) {
		const arg = args.shift();
		switch (arg) {
			case "--dir":
			case "-d":
				options.dir = path.resolve(args.shift() || ".");
				break;
			case "--out":
			case "-o":
				options.outFile = path.resolve(args.shift() || "");
				break;
			case "--install":
			case "-i":
				options.install = true;
				break;
			case "--help":
			case "-h":
				printHelp();
				process.exit(0);
			default:
				// treat as directory if first positional
				if (!options._positional) {
					options.dir = path.resolve(arg);
					options._positional = true;
				} else {
					console.warn(`Ignoring unknown argument: ${arg}`);
				}
				break;
		}
	}
	return options;
}

function printHelp() {
	console.log(`Build a .lumiaplugin archive for distribution.

Usage: npx lumia-plugin build [options]

Options:
  --dir, -d   Plugin directory (defaults to cwd)
  --out, -o   Output file path (defaults to ./<id>-<version>.lumiaplugin)
  --install, -i  Run npm install before packaging
  --help, -h  Show this help message
`);
}

async function main() {
	const options = parseArgs();
	const pluginDir = options.dir;

	try {
		await fs.promises.access(pluginDir, fs.constants.R_OK);
	} catch (error) {
		console.error(`✖ Unable to access plugin directory: ${pluginDir}`);
		process.exit(1);
	}

	try {
		const packageJsonPath = path.join(pluginDir, "package.json");
		if (fs.existsSync(packageJsonPath)) {
			if (options.install) {
				console.log("• Running npm install...");
				const result = spawnSync("npm", ["install"], {
					cwd: pluginDir,
					stdio: "inherit",
				});
				if (result.status !== 0) {
					console.error("✖ npm install failed. Aborting build.");
					process.exit(1);
				}
			} else {
				console.log("• Skipping npm install (use --install to enable).");
			}
		} else {
			console.log("• No package.json found; skipping npm install.");
		}

		const { manifest } = await readManifest(pluginDir);
		const errors = validateManifest(manifest);
		if (errors.length) {
			console.error("✖ Plugin manifest validation failed:");
			errors.forEach((err) => console.error(`  • ${err}`));
			process.exit(1);
		}

		const entryFile =
			typeof manifest.main === "string" && manifest.main.trim()
				? manifest.main.trim()
				: "main.js";
		const entryPath = path.resolve(pluginDir, entryFile);
		if (!fs.existsSync(entryPath)) {
			console.error(`✖ Entry file not found: ${entryFile}`);
			process.exit(1);
		}

		console.log(`• Running syntax check on ${entryFile}...`);
		const checkResult = spawnSync("node", ["--check", entryPath], {
			cwd: pluginDir,
			stdio: "inherit",
		});
		if (checkResult.status !== 0) {
			console.error("✖ Syntax check failed. Aborting build.");
			process.exit(1);
		}

		const files = await collectFiles(pluginDir);
		if (!files.length) {
			console.error(
				"✖ No files found to package (did you point to the plugin root?)",
			);
			process.exit(1);
		}

		const filename = `${manifest.id}-${manifest.version}.lumiaplugin`;
		const outputPath = options.outFile
			? options.outFile
			: path.resolve(filename);
		await createPluginArchive(pluginDir, outputPath, files);

		console.log("✔ Plugin package created");
		console.log(`  - output: ${outputPath}`);
		console.log(`  - files: ${files.length}`);
	} catch (error) {
		console.error(`✖ Build failed: ${error.message}`);
		process.exit(1);
	}
}

main();
