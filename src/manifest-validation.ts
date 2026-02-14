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

const pluginModCommandOptions = new Set([
  "delete",
  "copy",
  "translate",
  "shoutout",
  "ban",
  "unban",
  "timeout",
  "add-vip",
  "remove-vip",
  "add-moderator",
  "remove-moderator",
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateOverlayBundleEntries(value: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(value)) {
    return ["Manifest bundle.overlays must be an array of overlay IDs or shared download URLs"];
  }

  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) {
      errors.push(`Manifest bundle.overlays entry at index ${index} must be a non-empty overlay ID or URL string`);
    }
  });

  return errors;
}

function validateCommandBundleEntries(value: unknown): string[] {
  const errors: string[] = [];
  const hasSupportedExtension = (filePath: string): boolean => {
    const normalized = filePath.trim().toLowerCase();
    return normalized.endsWith(".lumia") || normalized.endsWith(".lumiastream");
  };

  if (!Array.isArray(value)) {
    return ["Manifest bundle.commands must be an array of command file paths"];
  }

  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) {
      errors.push(`Manifest bundle.commands entry at index ${index} must be a non-empty file path string`);
      return;
    }
    if (!hasSupportedExtension(entry)) {
      errors.push(`Manifest bundle.commands entry at index ${index} must reference a .lumia or .lumiastream file`);
    }
  });

  return errors;
}

function validateModCommandOptions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["config.modcommandOptions must be an array when provided"];
  }

  const errors: string[] = [];
  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry) || !pluginModCommandOptions.has(entry)) {
      errors.push(`config.modcommandOptions entry at index ${index} is invalid`);
    }
  });
  return errors;
}

function validateTranslations(value: unknown): string[] {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return ["config.translations file path must be a non-empty string"];
    }
    if (!normalized.endsWith(".json")) {
      return ["config.translations file path must reference a .json file"];
    }
    return [];
  }

  if (!isPlainObject(value)) {
    return ["config.translations must be an object or a .json file path when provided"];
  }

  const errors: string[] = [];
  Object.entries(value).forEach(([language, translationValue]) => {
    if (!isNonEmptyString(language)) {
      errors.push("config.translations language keys must be non-empty strings");
      return;
    }

    if (typeof translationValue === "string") {
      const normalized = translationValue.trim().toLowerCase();
      if (!normalized) {
        errors.push(`config.translations.${language} file path must be a non-empty string`);
      } else if (!normalized.endsWith(".json")) {
        errors.push(`config.translations.${language} file path must reference a .json file`);
      }
      return;
    }

    if (!isPlainObject(translationValue)) {
      errors.push(`config.translations.${language} must be an object or a relative .json file path`);
    }
  });

  return errors;
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

    if (config.hasChatbot !== undefined && typeof config.hasChatbot !== "boolean") {
      errors.push("config.hasChatbot must be a boolean when provided");
    }
    if (config.hasAI !== undefined && typeof config.hasAI !== "boolean") {
      errors.push("config.hasAI must be a boolean when provided");
    }
    if (config.chatbot !== undefined) {
      errors.push("config.chatbot is no longer supported. Use config.hasChatbot (boolean).");
    }
    if (config.modcommandOptions !== undefined) {
      errors.push(...validateModCommandOptions(config.modcommandOptions));
    }
    if (config.translations !== undefined) {
      errors.push(...validateTranslations(config.translations));
    }
  }

  const bundle = manifest.bundle ?? manifest.bundles;
  if (bundle !== undefined) {
    if (!isPlainObject(bundle)) {
      errors.push("Manifest bundle must be an object when provided");
    } else {
      const commandSection = bundle.commands;
      const overlaysSection = bundle.overlays;
      if (commandSection !== undefined) {
        errors.push(...validateCommandBundleEntries(commandSection));
      }
      if (overlaysSection !== undefined) {
        errors.push(...validateOverlayBundleEntries(overlaysSection));
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
