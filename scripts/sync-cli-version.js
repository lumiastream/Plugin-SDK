#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const rootPackagePath = path.join(repoRoot, 'package.json');
const cliPackagePath = path.join(repoRoot, 'cli', 'package.json');
const cliLockPath = path.join(repoRoot, 'cli', 'package-lock.json');
const cliExamplesPath = path.join(repoRoot, 'cli', 'examples');
const repoExamplesPath = path.join(repoRoot, 'examples');

function detectIndentationFromContent(content) {
	const match = content.match(/^[\t ]+(?=")/m);
	return match ? match[0] : '\t';
}

function loadJson(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');
	return {
		data: JSON.parse(content),
		indent: detectIndentationFromContent(content)
	};
}

function writeJson(filePath, data, indent = '\t') {
	fs.writeFileSync(filePath, `${JSON.stringify(data, null, indent)}\n`);
}

const { data: rootPackage } = loadJson(rootPackagePath);
const pluginVersion = rootPackage.version;
const pluginName = rootPackage.name;

const { data: cliPackage, indent: cliPackageIndent } = loadJson(cliPackagePath);
let cliPackageChanged = false;

if (cliPackage.version !== pluginVersion) {
	cliPackage.version = pluginVersion;
	cliPackageChanged = true;
}

const expectedDependencyVersion = `^${pluginVersion}`;
const escapedPluginName = pluginName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
cliPackage.dependencies = cliPackage.dependencies || {};

if (cliPackage.dependencies[pluginName] !== expectedDependencyVersion) {
	cliPackage.dependencies[pluginName] = expectedDependencyVersion;
	cliPackageChanged = true;
}

if (cliPackageChanged) {
	writeJson(cliPackagePath, cliPackage, cliPackageIndent);
	console.log(`Updated CLI package.json to version ${pluginVersion}`);
} else {
	console.log('CLI package.json already up to date');
}

if (fs.existsSync(cliLockPath)) {
	const { data: cliLock, indent: cliLockIndent } = loadJson(cliLockPath);
	let cliLockChanged = false;

	if (cliLock.version !== pluginVersion) {
		cliLock.version = pluginVersion;
		cliLockChanged = true;
	}

	if (cliLock.packages && cliLock.packages['']) {
		const rootEntry = cliLock.packages[''];

		if (rootEntry.version !== pluginVersion) {
			rootEntry.version = pluginVersion;
			cliLockChanged = true;
		}

		if (!rootEntry.dependencies) {
			rootEntry.dependencies = {};
		}

		if (rootEntry.dependencies[pluginName] !== expectedDependencyVersion) {
			rootEntry.dependencies[pluginName] = expectedDependencyVersion;
			cliLockChanged = true;
		}
	}

	if (cliLockChanged) {
		writeJson(cliLockPath, cliLock, cliLockIndent);
		console.log('Updated CLI package-lock.json');
	} else {
		console.log('CLI package-lock.json already up to date');
	}
} else {
	console.log('CLI package-lock.json not found, skipping');
}

const targetExampleDirs = ['base_plugin', 'settings_showcase', 'typescript_plugin'];

const exampleRoots = [...new Set([cliExamplesPath, repoExamplesPath])].filter((exampleRoot) =>
	fs.existsSync(exampleRoot)
);
const examplePackageJsonPaths = exampleRoots.flatMap((exampleRoot) =>
	targetExampleDirs
		.map((exampleDir) => path.join(exampleRoot, exampleDir, 'package.json'))
		.filter((examplePackagePath) => fs.existsSync(examplePackagePath))
);
let examplesUpdated = 0;

for (const examplePackagePath of examplePackageJsonPaths) {
	const fileContent = fs.readFileSync(examplePackagePath, 'utf8');
	let parsedContent;

	try {
		parsedContent = JSON.parse(fileContent);
	} catch {
		continue;
	}

	const originalDependencies =
		parsedContent.dependencies && parsedContent.dependencies[pluginName];

	if (!originalDependencies) {
		continue;
	}

	if (originalDependencies === expectedDependencyVersion) {
		continue;
	}

	const dependencyRegex = new RegExp(
		`("${escapedPluginName}"\\s*:\\s*)"[^"]+"`
	);

	const updatedContent = fileContent.replace(
		dependencyRegex,
		`$1"${expectedDependencyVersion}"`
	);

	if (updatedContent === fileContent) {
		parsedContent.dependencies[pluginName] = expectedDependencyVersion;
		const indent = detectIndentationFromContent(fileContent);
		writeJson(examplePackagePath, parsedContent, indent);
	} else {
		fs.writeFileSync(examplePackagePath, updatedContent);
	}

	examplesUpdated += 1;
}

if (examplesUpdated) {
	console.log(`Updated ${examplesUpdated} example package.json file${examplesUpdated > 1 ? 's' : ''}`);
} else {
	console.log('Example package.json files already up to date');
}
