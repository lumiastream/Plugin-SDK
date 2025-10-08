#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { readManifest, validateManifest } = require('./utils');

async function main() {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

  try {
    await fs.promises.access(target, fs.constants.R_OK);
  } catch (error) {
    console.error(`✖ Unable to access plugin directory: ${target}`);
    process.exit(1);
  }

  try {
    const { manifest, manifestPath } = await readManifest(target);
    const errors = validateManifest(manifest);

    const mainFile = manifest.main || 'main.js';
    const mainPath = path.join(target, mainFile);
    if (!fs.existsSync(mainPath)) {
      errors.push(`Main file not found: ${mainFile}`);
    }

    if (manifest.config?.actions) {
      manifest.config.actions.forEach((action, index) => {
        if (!action.type) {
          errors.push(`config.actions[${index}] is missing required field "type"`);
        }
        if (!Array.isArray(action.fields)) {
          errors.push(`config.actions[${index}].fields must be an array`);
        }
      });
    }

    if (manifest.config?.settings) {
      manifest.config.settings.forEach((setting, index) => {
        if (!setting.key) {
          errors.push(`config.settings[${index}] is missing required field "key"`);
        }
        if (!setting.type) {
          errors.push(`config.settings[${index}] is missing required field "type"`);
        }
      });
    }

    if (errors.length) {
      console.error('✖ Plugin validation failed:');
      errors.forEach((err) => console.error(`  • ${err}`));
      process.exit(1);
    }

    console.log('✔ Plugin manifest passed validation');
    console.log(`  - manifest: ${manifestPath}`);
    console.log(`  - main: ${mainFile}`);
  } catch (error) {
    console.error(`✖ Validation error: ${error.message}`);
    process.exit(1);
  }
}

main();
