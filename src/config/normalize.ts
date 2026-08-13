import { normalizeLanguage } from "#aiqqoxin3urs";
import type { I18nCheckOptions } from "#53cx0fxlre43";
import type {
  I18nConfig,
  NormalizedI18nConfig,
} from "./types.js";

const DEFAULT_I18N_DIR_NAME = "i18n";
const DEFAULT_I18N_EXTENSION = ".ts";
const DEFAULT_I18N_FALLBACK_LANGUAGE = "en";

function defineConfig<TConfig extends I18nConfig>(config: TConfig): TConfig {
  return config;
}

function normalizeConfig(config: I18nConfig = {}): NormalizedI18nConfig {
  const fallbackLanguage = normalizeLanguage(
    config.fallbackLanguage || config.defaultLanguage || DEFAULT_I18N_FALLBACK_LANGUAGE,
  );
  const defaultLanguage = normalizeLanguage(config.defaultLanguage || fallbackLanguage);

  return {
    check: {
      dirs: config.check?.dirs,
      ignoreDirs: normalizeStringList(config.check?.ignoreDirs),
      rootDir: normalizeOptionalString(config.check?.rootDir),
      strict: config.check?.strict !== false,
    },
    defaultLanguage,
    fallbackLanguage,
    local: {
      dirName: normalizeOptionalString(config.local?.dirName) || DEFAULT_I18N_DIR_NAME,
      extensions: normalizeExtensions(config.local?.extensions),
    },
    supportedLanguages: normalizeSupportedLanguages(config.supportedLanguages, defaultLanguage),
  };
}

function createCheckOptionsFromConfig(
  config: NormalizedI18nConfig,
  overrides: I18nCheckOptions = {},
): I18nCheckOptions {
  const rootDir = overrides.rootDir || config.check.rootDir;
  return {
    defaultLanguage: overrides.defaultLanguage || config.defaultLanguage,
    dirName: overrides.dirName || config.local.dirName,
    dirs: overrides.dirs || config.check.dirs,
    extensions: overrides.extensions || config.local.extensions,
    ignoreDirs: mergeLists(config.check.ignoreDirs, overrides.ignoreDirs),
    rootDir,
    supportedLanguages: overrides.supportedLanguages || config.supportedLanguages,
  };
}

function normalizeExtensions(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [DEFAULT_I18N_EXTENSION];
  const normalized = normalizeStringList(values).map((item) => item.startsWith(".") ? item : `.${item}`);
  return normalized.length > 0 ? normalized : [DEFAULT_I18N_EXTENSION];
}

function normalizeSupportedLanguages(
  value: readonly string[] | undefined,
  defaultLanguage: string,
): string[] | undefined {
  const languages = Array.from(new Set((value || []).map(normalizeLanguage).filter(Boolean)));
  if (languages.length === 0) return undefined;
  return languages.includes(defaultLanguage) ? languages : [defaultLanguage, ...languages];
}

function normalizeStringList(value: readonly string[] | undefined): string[] {
  return Array.from(new Set((value || []).map(normalizeOptionalString).filter(Boolean)));
}

function mergeLists(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): string[] | undefined {
  const merged = normalizeStringList([...(left || []), ...(right || [])]);
  return merged.length ? merged : undefined;
}

function normalizeOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export {
  DEFAULT_I18N_DIR_NAME,
  DEFAULT_I18N_EXTENSION,
  DEFAULT_I18N_FALLBACK_LANGUAGE,
  createCheckOptionsFromConfig,
  defineConfig,
  normalizeConfig,
};
