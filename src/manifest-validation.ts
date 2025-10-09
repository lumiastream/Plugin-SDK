import { PluginManifest, PluginIntegrationConfig } from "./types";

type PartialManifest = Partial<PluginManifest> & Record<string, unknown>;

type ConfigArrayKey = keyof Pick<PluginIntegrationConfig, "settings" | "actions" | "variables" | "alerts">;

const requiredManifestFields: Array<keyof PluginManifest> = [
  "id",
  "name",
  "version",
  "author",
  "description",
  "license",
  "lumiaVersion",
];

const configArrayFields: Array<{ key: ConfigArrayKey; message: string }> = [
  { key: "settings", message: "config.settings must be an array when provided" },
  { key: "actions", message: "config.actions must be an array when provided" },
  { key: "variables", message: "config.variables must be an array when provided" },
  { key: "alerts", message: "config.alerts must be an array when provided" },
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Perform lightweight validation on a plugin manifest definition.
 * Returns an array of error strings. An empty array indicates the
 * manifest passed all heuristics.
 */
export function validatePluginManifest(manifest: PartialManifest | null | undefined): string[] {
  const errors: string[] = [];

  if (!isPlainObject(manifest)) {
    return ["Manifest must be a JSON object"];
  }

  for (const field of requiredManifestFields) {
    const value = manifest[field];
    if (!isNonEmptyString(value)) {
      errors.push(`Missing or invalid manifest field: ${String(field)}`);
    }
  }

  const id = manifest.id;
  if (typeof id === "string") {
    if (/[-\s]/.test(id)) {
      errors.push("Manifest id must not contain spaces or hyphens");
    } else if (!/^[_a-zA-Z0-9]+$/.test(id)) {
      errors.push("Manifest id may only contain alphanumeric characters and underscores");
    }
  }

  const category = manifest.category;
  if (!category || (typeof category !== "string" && !Array.isArray(category))) {
    errors.push("Manifest must declare a category string");
  }

  const config = manifest.config;
  if (!isPlainObject(config)) {
    errors.push("Manifest config must be an object");
  } else {
    for (const { key, message } of configArrayFields) {
      const value = config[key];
      if (value !== undefined && !Array.isArray(value)) {
        errors.push(message);
      }
    }
  }

  return errors;
}

/**
 * Convenience alias preserved for backwards compatibility with the CLI.
 */
export const validateManifest = validatePluginManifest;

export default validatePluginManifest;
