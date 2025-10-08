# Lumia Stream Plugin CLI

The `lumia-plugin` package bundles the command-line tools for creating, building, and validating Lumia Stream plugins without pulling the full SDK into your runtime dependencies.

## Commands

```
npx lumia-plugin create <directory>
npx lumia-plugin build [--dir <path>] [--out <file>]
npx lumia-plugin validate <plugin-directory>
```

Run any command with `--help` to see detailed options.

## Template

The CLI ships with a showcase template that demonstrates logging, settings, variables, and alert handling. It mirrors the starter plugin available in this repository so the CLI can scaffold it anywhere.

## License

MIT
