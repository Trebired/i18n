import { GRAMMAR_PIPES, isPluralForms } from "@trebired/grammar";
import type { I18nDictionary } from "#dtqts236bejn";

type GrammarIssue = {
  code: "i18n-plural-categories" | "i18n-unknown-pipe";
  message: string;
};

const PIPED_PLACEHOLDER = /\{\{?\s*[A-Za-z0-9_.-]+((?:\s*\|\s*[A-Za-z]+(?::[^|}\s]+)*)+)\s*\}?\}/gu;

function requiredPluralCategories(language: string): string[] {
  try {
    return new Intl.PluralRules(language).resolvedOptions().pluralCategories;
  } catch {
    return ["other"];
  }
}

function collectPipeIssues(template: string, key: string, issues: GrammarIssue[]): void {
  for (const match of template.matchAll(PIPED_PLACEHOLDER)) {
    for (const part of match[1].split("|").map((item) => item.trim()).filter(Boolean)) {
      const name = part.split(":")[0].trim();
      if (!GRAMMAR_PIPES.includes(name)) issues.push({ code: "i18n-unknown-pipe", message: `${key} uses unknown pipe ${name}` });
    }
  }
}

function collectPluralIssues(value: Record<string, string>, key: string, language: string, issues: GrammarIssue[]): void {
  const missing = requiredPluralCategories(language).filter((category) => typeof value[category] !== "string");
  if (missing.length) {
    issues.push({ code: "i18n-plural-categories", message: `${key} is missing plural categories ${missing.join(",")} for ${language}` });
  }
  Object.values(value).forEach((template) => collectPipeIssues(template, key, issues));
}

function collectGrammarIssues(
  messages: I18nDictionary,
  language: string,
  prefix = "",
  issues: GrammarIssue[] = [],
): GrammarIssue[] {
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") collectPipeIssues(value, path, issues);
    else if (isPluralForms(value)) collectPluralIssues(value as Record<string, string>, path, language, issues);
    else collectGrammarIssues(value, language, path, issues);
  }
  return issues;
}

export { collectGrammarIssues };
export type { GrammarIssue };
