export {
  DEFAULT_I18N_DIR_NAME,
  DEFAULT_I18N_EXTENSION,
  DEFAULT_I18N_FALLBACK_LANGUAGE,
  createCheckOptionsFromConfig,
  defineConfig,
  normalizeConfig,
} from "./normalize.js";
export {
  I18N_PROJECT_CONFIG_PATH,
  findConfig,
  loadConfig,
} from "./load.js";

export type {
  I18nCheckerConfig,
  I18nConfig,
  I18nConfiguredCheckOptions,
  I18nLocalConfig,
  LoadI18nConfigOptions,
  LoadedI18nConfig,
  NormalizedI18nCheckerConfig,
  NormalizedI18nConfig,
  NormalizedI18nLocalConfig,
} from "./types.js";
