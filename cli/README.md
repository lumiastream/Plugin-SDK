# Lumia Stream Plugin CLI

The `@lumiastream/plugin-cli` package bundles the command-line tools for creating, building, and validating Lumia Stream plugins without pulling the full SDK into your runtime dependencies.

## Commands

```
npx @lumiastream/plugin-cli create <directory>
npx @lumiastream/plugin-cli build [--dir <path>] [--out <file>]
npx @lumiastream/plugin-cli validate <plugin-directory>
```

Run any command with `--help` to see detailed options.

## Template

The CLI ships with a showcase template that demonstrates logging, settings, variables, and alert handling. It mirrors the starter plugin available in this repository so the CLI can scaffold it anywhere.

## License

MIT
