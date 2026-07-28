export {
  createLocalTranslator,
  createTranslator,
  defineMessages,
  interpolateMessage,
  languageCandidates,
  lookupDictionaryValue,
  normalizeLanguage,
  translate,
} from "./translation.js";
export {
  assertColocatedI18n,
  checkColocatedI18n,
  formatI18nCheckViolations,
  parseMessagesFile,
  parseMessagesSource,
} from "./checker/index.js";
export {
  runCli,
} from "./cli.js";

export type {
  I18nCheckOptions,
  I18nCheckResult,
  I18nCheckViolation,
  I18nCheckViolationCode,
} from "./checker/index.js";

export type {
  I18nBundle,
  I18nDictionary,
  I18nMessageKey,
  I18nPrimitive,
  I18nSupportedLanguage,
  I18nTranslateOptions,
  I18nTranslator,
  I18nVariables,
} from "./types.js";
