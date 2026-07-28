type I18nPrimitive = string;

type I18nDictionary = {
  readonly [key: string]: I18nPrimitive | I18nDictionary;
};

type I18nBundle<
  TLanguage extends string = string,
  TMessages extends I18nDictionary = I18nDictionary,
> = Partial<Record<TLanguage, TMessages | undefined>>;

type I18nSupportedLanguage = string;
type I18nVariables = Record<string, unknown>;

type I18nMessageKey<TMessages extends I18nDictionary> = {
  [K in keyof TMessages & string]: TMessages[K] extends string
    ? K
    : TMessages[K] extends I18nDictionary
      ? K | `${K}.${I18nMessageKey<TMessages[K]>}`
      : K;
}[keyof TMessages & string];

type I18nTranslator<TMessages extends I18nDictionary = I18nDictionary> = <
  TKey extends I18nMessageKey<TMessages> | (string & {}),
>(
  key: TKey,
  variables?: I18nVariables,
) => string;

type I18nTranslateOptions = {
  fallbackLanguage?: string;
};

export type {
  I18nBundle,
  I18nDictionary,
  I18nMessageKey,
  I18nPrimitive,
  I18nSupportedLanguage,
  I18nTranslateOptions,
  I18nTranslator,
  I18nVariables,
};
