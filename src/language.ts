function normalizeLanguage(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/_/gu, "-") : "";
}

function normalizeLanguageTag(value: unknown): string {
  return normalizeLanguage(value);
}

function parseLanguageWeight(entry: string): number {
  const match = /;\s*q=([0-9.]+)/iu.exec(entry);
  const value = match ? Number(match[1]) : 1;
  return Number.isFinite(value) ? value : 0;
}

function normalizeAllowedLanguages(values: readonly unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = normalizeLanguage(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}

function matchSupportedLanguage<TLanguage extends string>(
  input: unknown,
  supportedLanguages: readonly TLanguage[],
): TLanguage | "" {
  const normalized = normalizeLanguage(input).split(";")[0].trim();
  if (!normalized) return "";

  const supported = new Set<string>(normalizeAllowedLanguages(supportedLanguages));
  if (supported.has(normalized)) return normalized as TLanguage;

  const [base] = normalized.split("-");
  return base && supported.has(base) ? base as TLanguage : "";
}

function pickSupportedLanguage<TLanguage extends string>(
  inputs: Iterable<unknown>,
  supportedLanguages: readonly TLanguage[],
): TLanguage | "" {
  for (const input of inputs) {
    const matched = matchSupportedLanguage(input, supportedLanguages);
    if (matched) return matched;
  }
  return "";
}

function readPreferredLanguageHeader<TLanguage extends string>(
  input: unknown,
  supportedLanguages: readonly TLanguage[],
): TLanguage | "" {
  const entries = String(input == null ? "" : input)
  .split(",")
  .map((entry, index) => ({
        entry: entry.trim(),
        index,
        weight: parseLanguageWeight(entry),
  }))
  .filter((item) => item.entry)
  .sort(
    (left, right) => right.weight - left.weight || left.index - right.index,
  );

  for (const item of entries) {
    const matched = matchSupportedLanguage(item.entry, supportedLanguages);
    if (matched) return matched;
  }
  return "";
}

function documentLang(fallback = "en"): string {
  const doc = (globalThis as { document?: { documentElement?: { lang?: string } } }).document;
  return normalizeLanguage(doc?.documentElement?.lang) || normalizeLanguage(fallback) || "en";
}

export {
  documentLang,
  matchSupportedLanguage,
  normalizeLanguage,
  normalizeLanguageTag,
  pickSupportedLanguage,
  readPreferredLanguageHeader,
};
