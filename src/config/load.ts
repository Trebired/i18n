import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type {
  I18nConfig,
  LoadI18nConfigOptions,
  LoadedI18nConfig,
} from "./types.js";
import { normalizeConfig } from "./normalize.js";

const WORKSPACE_CONFIG_DIR = ".trebired";
const I18N_PROJECT_CONFIG_PATH = `${WORKSPACE_CONFIG_DIR}/i18n/config.ts`;

async function loadConfig(
  projectRoot = process.cwd(),
  options: LoadI18nConfigOptions = {},
): Promise<LoadedI18nConfig> {
  const root = path.resolve(projectRoot);
  const configPath = options.configPath
  ? path.resolve(root, options.configPath)
  : await findConfig(options.searchFrom || root, root);

  if (!configPath) {
    if (options.defaultIfMissing === false) throw new Error("i18n config was not found");
    return { config: normalizeConfig({}), configPath: null, dependencies: [] };
  }

  if (!await pathExists(configPath)) {
    throw new Error(`i18n config was not found: ${configPath}`);
  }

  const imported = await import(pathToFileURL(configPath).href);
  return {
    config: normalizeConfig(readDefaultConfig(imported, configPath)),
    configPath,
    dependencies: [configPath],
  };
}

async function findConfig(startDir = process.cwd(), boundaryDir?: string): Promise<string|null> {
  let current = path.resolve(startDir);
  const boundary = boundaryDir ? path.resolve(boundaryDir) : "";

  for (;; ) {
    const candidate = path.join(current, I18N_PROJECT_CONFIG_PATH);
    if (await pathExists(candidate)) return candidate;
    if (boundary && current === boundary) return null;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  }
  catch {
    return false;
  }
}

function readDefaultConfig(imported: unknown, configPath: string): I18nConfig {
  const candidate = imported && typeof imported === "object"
  ? (imported as { default?: unknown }).default
  : undefined;

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new Error(`i18n config must default-export an object: ${configPath}`);
  }

  return candidate as I18nConfig;
}

export {
  I18N_PROJECT_CONFIG_PATH,
  findConfig,
  loadConfig,
};
