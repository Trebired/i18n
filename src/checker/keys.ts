import type { I18nDictionary } from "#dtqts236bejn";

function flattenMessageKeys(messages: I18nDictionary): string[] {
  const keys = new Set<string>();
  collectMessageKeys(messages, "", keys);
  return Array.from(keys).sort();
}

function collectMessageKeys(messages: I18nDictionary, prefix: string, keys: Set<string>): void {
  for (const [key, value] of Object.entries(messages)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      keys.add(nextKey);
      continue;
    }
    collectMessageKeys(value, nextKey, keys);
  }
}

function compareKeySets(baseKeys: string[], candidateKeys: string[]): {
  extra: string[];
  missing: string[];
} {
  const base = new Set(baseKeys);
  const candidate = new Set(candidateKeys);

  return {
    extra: candidateKeys.filter((key) => !base.has(key)),
    missing: baseKeys.filter((key) => !candidate.has(key)),
  };
}

export {
  compareKeySets,
  flattenMessageKeys,
};
