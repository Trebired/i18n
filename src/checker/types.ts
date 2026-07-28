import type { I18nDictionary } from "#dtqts236bejn";

type I18nCheckViolationCode =
  | "i18n-folder-missing"
  | "i18n-invalid-default-export"
  | "i18n-key-mismatch"
  | "i18n-missing-language-file"
  | "i18n-unsupported-language-file";

type I18nCheckViolation = {
  code: I18nCheckViolationCode;
  filePath?: string;
  folderPath: string;
  language?: string;
  message: string;
};

type I18nCheckOptions = {
  defaultLanguage?: string;
  dirName?: string;
  dirs?: string | string[];
  extensions?: string | string[];
  ignoreDirs?: string[];
  rootDir?: string;
  supportedLanguages?: readonly string[];
};

type I18nCheckResult = {
  checkedFolders: number;
  ok: boolean;
  rootDir: string;
  violations: I18nCheckViolation[];
};

type NormalizedI18nCheckOptions = {
  defaultLanguage: string;
  dirName: string;
  dirs: string[];
  extensions: string[];
  ignoreDirs: Set<string>;
  rootDir: string;
  supportedLanguages?: string[];
};

type ParsedI18nLanguageFile = {
  messages: I18nDictionary;
};

export type {
  I18nCheckOptions,
  I18nCheckResult,
  I18nCheckViolation,
  I18nCheckViolationCode,
  NormalizedI18nCheckOptions,
  ParsedI18nLanguageFile,
};
