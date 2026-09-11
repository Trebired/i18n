import { applyGrammarPipe, isPluralForms, selectPlural } from "@trebired/grammar";
import { isRecord as isObject } from "@trebired/utils";
import { normalizeLanguage } from "./language.js";
import type {
  I18nBundle,
  I18nDictionary,
  I18nPluralMessage,
  I18nTranslateOptions,
  I18nTranslator,
  I18nVariables,
} from "./types.js";

const DEFAULT_FALLBACK_LANGUAGE = "en";
const PLACEHOLDER_PATTERN =
/\{\{\s*([A-Za-z0-9_.-]+)((?:\s*\|\s*[A-Za-z]+(?::[^|}\s]+)*)*)\s*\}\}|\{([A-Za-z0-9_.-]+)((?:\|[A-Za-z]+(?::[^|}]+)*)*)\}/gu;

type LocalizedMessage = {
  language: string;
  message: string | I18nPluralMessage | "";
};

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
  const found = lookupLocalizedMessage({
      bundle,
      fallbackLanguage,
      key,
      language,
  });
  const template = typeof found.message === "string"
  ? found.message
  : selectPlural(variables.count, found.message, found.language);

  return interpolateMessage(template || key, variables, found.language || language);
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

function lookupLocalizedMessage<TMessages extends I18nDictionary>(args: {
    bundle: I18nBundle<string, TMessages>|undefined;
    fallbackLanguage: string;
    key: string;
    language: string | null | undefined;
}): LocalizedMessage {
  if (!args.bundle) return { language: "", message: "" };

  for (const candidate of languageCandidates(args.language, args.fallbackLanguage)) {
    const value = lookupDictionaryValue(args.bundle[candidate], args.key);
    if (typeof value === "string" || isPluralForms(value)) return { language: candidate, message: value };
  }

  return { language: "", message: "" };
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

function interpolateMessage(template: string, variables: I18nVariables, language?: string | null): string {
  return template.replace(PLACEHOLDER_PATTERN, (match, doubleKey, doublePipes, singleKey, singlePipes) => {
      const value = lookupVariable(variables, doubleKey || singleKey);
      if (value == null) return match;
      const pipes = parsePipes(doublePipes || singlePipes || "");
      if (!pipes.length) return String(value);
      return String(pipes.reduce<unknown>((current, pipe) => {
            return applyGrammarPipe(current, pipe.name, pipe.args, language);
          }, value));
  });
}

function parsePipes(source: string): { args: string[]; name: string }[] {
  return source
  .split("|")
  .map((part) => part.trim())
  .filter(Boolean)
  .map((part) => {
      const [name, ...args] = part.split(":").map((item) => item.trim());
      return { args, name };
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
