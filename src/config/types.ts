import type { I18nCheckOptions } from "#53cx0fxlre43";

type I18nLocalConfig = {
  dirName?: string;
  extensions?: string | string[];
};

type I18nCheckerConfig = {
  dirs?: string | string[];
  ignoreDirs?: string[];
  rootDir?: string;
  strict?: boolean;
};

type I18nConfig = {
  check?: I18nCheckerConfig;
  defaultLanguage?: string;
  fallbackLanguage?: string;
  forVersion?: string;
  local?: I18nLocalConfig;
  supportedLanguages?: readonly string[];
};

type NormalizedI18nLocalConfig = {
  dirName: string;
  extensions: string[];
};

type NormalizedI18nCheckerConfig = {
  dirs?: string | string[];
  ignoreDirs: string[];
  rootDir?: string;
  strict: boolean;
};

type NormalizedI18nConfig = {
  check: NormalizedI18nCheckerConfig;
  defaultLanguage: string;
  fallbackLanguage: string;
  forVersion: string;
  local: NormalizedI18nLocalConfig;
  supportedLanguages?: string[];
};

type LoadedI18nConfig = {
  config: NormalizedI18nConfig;
  configPath: string | null;
  dependencies: string[];
};

type LoadI18nConfigOptions = {
  configPath?: string;
  defaultIfMissing?: boolean;
  searchFrom?: string;
};

type I18nConfiguredCheckOptions = I18nCheckOptions;

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
};
