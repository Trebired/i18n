import fs from "node:fs/promises";
import path from "node:path";

import { compareKeySets, flattenMessageKeys } from "./keys.js";
import { normalizeI18nCheckOptions, normalizeLanguage } from "./options.js";
import { parseMessagesFile } from "./parser.js";
import { findI18nFolders } from "./scan.js";
import type {
  I18nCheckOptions,
  I18nCheckResult,
  I18nCheckViolation,
  NormalizedI18nCheckOptions,
} from "./types.js";

type LoadedLanguage = {
  filePath: string;
  keys: string[];
  language: string;
};

async function checkColocatedI18n(options: I18nCheckOptions = {}): Promise<I18nCheckResult> {
  const normalized = normalizeI18nCheckOptions(options);
  const folders = await findI18nFolders(normalized);
  const violations: I18nCheckViolation[] = [];

  for (const folderPath of folders) {
    violations.push(...await checkI18nFolder(folderPath, normalized));
  }

  return {
    checkedFolders: folders.length,
    ok: violations.length === 0,
    rootDir: normalized.rootDir,
    violations,
  };
}

async function assertColocatedI18n(options: I18nCheckOptions = {}): Promise<I18nCheckResult> {
  const result = await checkColocatedI18n(options);
  if (!result.ok) {
    const error = new Error(formatI18nCheckViolations(result.violations, result.rootDir));
    Object.assign(error, { violations: result.violations });
    throw error;
  }
  return result;
}

function formatI18nCheckViolations(violations: I18nCheckViolation[], rootDir = process.cwd()): string {
  if (violations.length === 0) return "I18n check passed.";
  const lines = ["I18n check failed:"];
  for (const violation of violations) {
    const folder = toRelative(rootDir, violation.folderPath);
    const file = violation.filePath ? ` :: ${toRelative(rootDir, violation.filePath)}` : "";
    lines.push(`- ${violation.code} :: ${folder}${file} :: ${violation.message}`);
  }
  return lines.join("\n");
}

async function checkI18nFolder(
  folderPath: string,
  options: NormalizedI18nCheckOptions,
): Promise<I18nCheckViolation[]> {
  const violations: I18nCheckViolation[] = [];
  const entries = await readFolderEntries(folderPath, violations);
  if (!entries) return violations;

  const files = collectLanguageFiles(folderPath, entries, options, violations);
  const languages = expectedLanguages(files, options);
  validateExpectedFiles(folderPath, files, languages, options, violations);
  const loaded = await loadLanguages(folderPath, files, languages, violations);
  validateLanguageKeys(folderPath, loaded, options, violations);
  return violations;
}

async function readFolderEntries(
  folderPath: string,
  violations: I18nCheckViolation[],
): Promise<import("node:fs").Dirent[] | null> {
  try {
    return await fs.readdir(folderPath, { withFileTypes: true });
  } catch {
    violations.push(createViolation("i18n-folder-missing", folderPath, undefined, "folder does not exist"));
    return null;
  }
}

function collectLanguageFiles(
  folderPath: string,
  entries: import("node:fs").Dirent[],
  options: NormalizedI18nCheckOptions,
  violations: I18nCheckViolation[],
): Map<string, string> {
  const files = new Map<string, string>();
  for (const entry of entries) {
    const filePath = path.join(folderPath, entry.name);
    const language = entry.isFile() ? languageFromFileName(entry.name, options) : "";
    if (!language || options.supportedLanguages && !options.supportedLanguages.includes(language)) {
      violations.push(createViolation("i18n-unsupported-language-file", folderPath, filePath, "unsupported language file"));
      continue;
    }
    files.set(language, filePath);
  }
  return files;
}

function expectedLanguages(files: Map<string, string>, options: NormalizedI18nCheckOptions): string[] {
  if (options.supportedLanguages) return options.supportedLanguages;
  const inferred = Array.from(files.keys()).sort();
  return inferred.includes(options.defaultLanguage) ? inferred : [options.defaultLanguage, ...inferred];
}

function validateExpectedFiles(
  folderPath: string,
  files: Map<string, string>,
  languages: string[],
  options: NormalizedI18nCheckOptions,
  violations: I18nCheckViolation[],
): void {
  for (const language of languages) {
    if (files.has(language)) continue;
    const filePath = path.join(folderPath, `${language}${options.extensions[0]}`);
    violations.push(createViolation("i18n-missing-language-file", folderPath, filePath, `missing ${language} file`));
  }
}

async function loadLanguages(
  folderPath: string,
  files: Map<string, string>,
  languages: string[],
  violations: I18nCheckViolation[],
): Promise<LoadedLanguage[]> {
  const loaded: LoadedLanguage[] = [];
  for (const language of languages) {
    const filePath = files.get(language);
    if (!filePath) continue;
    try {
      loaded.push({
        filePath,
        keys: flattenMessageKeys(await parseMessagesFile(filePath)),
        language,
      });
    } catch (error) {
      violations.push(createViolation("i18n-invalid-default-export", folderPath, filePath, formatError(error)));
    }
  }
  return loaded;
}

function validateLanguageKeys(
  folderPath: string,
  loaded: LoadedLanguage[],
  options: NormalizedI18nCheckOptions,
  violations: I18nCheckViolation[],
): void {
  const fallback = loaded.find((item) => item.language === options.defaultLanguage);
  if (!fallback) return;

  for (const item of loaded) {
    if (item.language === options.defaultLanguage) continue;
    const comparison = compareKeySets(fallback.keys, item.keys);
    if (comparison.missing.length === 0 && comparison.extra.length === 0) continue;
    violations.push(createViolation("i18n-key-mismatch", folderPath, item.filePath, formatKeyMismatch(item.language, comparison)));
  }
}

function languageFromFileName(fileName: string, options: NormalizedI18nCheckOptions): string {
  const extension = options.extensions.find((item) => fileName.endsWith(item));
  if (!extension) return "";
  const base = fileName.slice(0, -extension.length);
  const language = normalizeLanguage(base);
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(language) ? language : "";
}

function createViolation(
  code: I18nCheckViolation["code"],
  folderPath: string,
  filePath: string | undefined,
  message: string,
): I18nCheckViolation {
  return { code, filePath, folderPath, message };
}

function formatKeyMismatch(language: string, comparison: { extra: string[]; missing: string[] }): string {
  return [
    `language ${language} keys differ from fallback`,
    comparison.missing.length ? `missing=${comparison.missing.join(",")}` : "",
    comparison.extra.length ? `extra=${comparison.extra.join(",")}` : "",
  ].filter(Boolean).join(" :: ");
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toRelative(rootDir: string, filePath: string): string {
  const relative = path.relative(rootDir, filePath).replace(/\\/gu, "/");
  return relative && !relative.startsWith("..") ? relative : filePath;
}

export {
  assertColocatedI18n,
  checkColocatedI18n,
  formatI18nCheckViolations,
};
