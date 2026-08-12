import path from "node:path";

import { normalizeLanguage } from "#aiqqoxin3urs";
import type { I18nCheckOptions, NormalizedI18nCheckOptions } from "./types.js";

const DEFAULT_DIR_NAME = "i18n";
const DEFAULT_EXTENSION = ".ts";
const DEFAULT_FALLBACK_LANGUAGE = "en";
const DEFAULT_IGNORE_DIRS = [".git", ".tmp", "coverage", "dist", "node_modules"];

function normalizeI18nCheckOptions(options: I18nCheckOptions = {}): NormalizedI18nCheckOptions {
  const rootDir = path.resolve(String(options.rootDir || "").trim() || process.cwd());
  const defaultLanguage = normalizeLanguage(options.defaultLanguage || DEFAULT_FALLBACK_LANGUAGE);
  const extensions = normalizeExtensions(options.extensions);
  const supportedLanguages = normalizeSupportedLanguages(options.supportedLanguages, defaultLanguage);

  return {
    defaultLanguage,
    dirName: normalizeSegment(options.dirName) || DEFAULT_DIR_NAME,
    dirs: normalizeDirs(options.dirs, rootDir),
    extensions,
    ignoreDirs: new Set([...DEFAULT_IGNORE_DIRS, ...(options.ignoreDirs || [])].map((value) => path.basename(value))),
    rootDir,
    supportedLanguages,
  };
}

function normalizeSupportedLanguages(
  languages: readonly string[] | undefined,
  defaultLanguage: string,
): string[] | undefined {
  const normalized = Array.from(new Set((languages || []).map(normalizeLanguage).filter(Boolean)));
  if (normalized.length === 0) return undefined;
  return normalized.includes(defaultLanguage) ? normalized : [defaultLanguage, ...normalized];
}

function normalizeExtensions(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [DEFAULT_EXTENSION];
  return Array.from(new Set(values.map((item) => {
          const normalized = normalizeSegment(item);
          return normalized ? normalized.startsWith(".") ? normalized : `.${normalized}` : "";
      }).filter(Boolean)));
}

function normalizeDirs(value: string | string[] | undefined, rootDir: string): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
  .map((item) => String(item || "").trim())
  .filter(Boolean)
  .map((item) => path.isAbsolute(item) ? item : path.resolve(rootDir, item));
}

function normalizeSegment(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export {
  DEFAULT_DIR_NAME,
  DEFAULT_EXTENSION,
  DEFAULT_FALLBACK_LANGUAGE,
  DEFAULT_IGNORE_DIRS,
  normalizeI18nCheckOptions,
  normalizeLanguage,
};
