import { normalizeLanguage } from "./language.js";
import type {
  I18nBundle,
  I18nDictionary,
  I18nTranslateOptions,
  I18nTranslator,
  I18nVariables,
} from "./types.js";

const DEFAULT_FALLBACK_LANGUAGE = "en";

function defineMessages<TMessages extends I18nDictionary>(messages: TMessages): TMessages {
  return messages;
}

function translate<TMessages extends I18nDictionary=I18nDictionary>(
  bundle: I18nBundle<string, TMessages>|undefined,
  language: string | null | undefined,
  key: string,
  variables: I18nVariables = {},
  options: I18nTranslateOptions = {},
): string {
  const fallbackLanguage = normalizeLanguage(options.fallbackLanguage) || DEFAULT_FALLBACK_LANGUAGE;
  const template = lookupLocalizedTemplate({
      bundle,
      fallbackLanguage,
      key,
      language,
  });

  return interpolateMessage(template || key, variables);
}

function createTranslator<TMessages extends I18nDictionary=I18nDictionary>(
  bundle: I18nBundle<string, TMessages>,
  language: string | null | undefined,
  options: I18nTranslateOptions = {},
): I18nTranslator<TMessages> {
  return (key, variables) => translate(bundle, language, String(key), variables || {}, options);
}

function createLocalTranslator(
  sourceUrl: string | URL,
  language: string | null | undefined,
): I18nTranslator {
  void language;
  const source = sourceUrl instanceof URL ? sourceUrl.href : String(sourceUrl || "");
  throw new Error(`i18n-local-translator-unbound :: ${source}`);
}

function lookupLocalizedTemplate<TMessages extends I18nDictionary>(args: {
    bundle: I18nBundle<string, TMessages>|undefined;
    fallbackLanguage: string;
    key: string;
    language: string | null | undefined;
}): string {
  if (!args.bundle) return "";

  for (const candidate of languageCandidates(args.language, args.fallbackLanguage)) {
    const value = lookupDictionaryValue(args.bundle[candidate], args.key);
    if (typeof value === "string") return value;
  }

  return "";
}

function languageCandidates(language: string | null | undefined, fallbackLanguage: string): string[] {
  const normalized = normalizeLanguage(language);
  const fallback = normalizeLanguage(fallbackLanguage) || DEFAULT_FALLBACK_LANGUAGE;
  const candidates: string[] = [];

  if (normalized) {
    candidates.push(normalized);
    const base = normalized.split("-")[0];
    if (base && base !== normalized) candidates.push(base);
  }

  candidates.push(fallback);
  return Array.from(new Set(candidates));
}

function lookupDictionaryValue(dictionary: I18nDictionary | undefined, key: string): unknown {
  if (!dictionary) return undefined;
  if (hasOwn(dictionary, key) && typeof dictionary[key] === "string") {
    return dictionary[key];
  }

  let current: unknown = dictionary;
  for (const segment of key.split(".")) {
    if (!segment || !isObject(current)) return undefined;
    current = current[segment];
  }

  return current;
}

function interpolateMessage(template: string, variables: I18nVariables): string {
  return template.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}|\{([A-Za-z0-9_.-]+)\}/gu, (match, doubleKey, singleKey) => {
      const value = lookupVariable(variables, doubleKey || singleKey);
      return value == null ? match : String(value);
  });
}

function lookupVariable(variables: I18nVariables, key: string): unknown {
  let current: unknown = variables;

  for (const segment of key.split(".")) {
    if (!segment || !isObject(current)) return undefined;
    current = current[segment];
  }

  return current;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export {
  createLocalTranslator,
  createTranslator,
  defineMessages,
  interpolateMessage,
  languageCandidates,
  lookupDictionaryValue,
  normalizeLanguage,
  translate,
};
