#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const {
	readManifest,
	validateManifest,
	collectFiles,
	createPluginArchive,
} = require("./utils");

function parseArgs() {
	const args = process.argv.slice(2);
	const options = { dir: process.cwd(), outFile: null };
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

Usage: npx build-lumiastream-plugin [options]

Options:
  --dir, -d   Plugin directory (defaults to cwd)
  --out, -o   Output file path (defaults to ./<id>-<version>.lumiaplugin)
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
		const { manifest } = await readManifest(pluginDir);
		const errors = validateManifest(manifest);
		if (errors.length) {
			console.error("✖ Plugin manifest validation failed:");
			errors.forEach((err) => console.error(`  • ${err}`));
			process.exit(1);
		}

		const files = await collectFiles(pluginDir);
		if (!files.length) {
			console.error(
				"✖ No files found to package (did you point to the plugin root?)"
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
