#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const command = args[0];

const commands = {
	create: "create-plugin.js",
	build: "build-plugin.js",
	validate: "validate-plugin.js",
};

const scriptArgs = args.slice(1);

if (!command || !commands[command]) {
	console.log(`Lumia Stream Plugin CLI

Usage: lumia-plugin <command> [options]

Commands:
  create [directory]     Create a new plugin from template
  build [directory]      Build a plugin into .lumiaplugin package
  validate [file]        Validate a .lumiaplugin package

Examples:
  lumia-plugin create my_plugin
  lumia-plugin build ./my_plugin
  lumia-plugin validate my_plugin.lumiaplugin
`);
	process.exit(command ? 1 : 0);
}

const scriptPath = path.join(__dirname, commands[command]);

const child = spawn("node", [scriptPath, ...scriptArgs], {
	stdio: "inherit",
	cwd: process.cwd(),
});

child.on("exit", (code) => {
	process.exit(code || 0);
});
