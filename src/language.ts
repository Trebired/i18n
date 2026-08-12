function normalizeLanguage(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/_/gu, "-") : "";
}

export { normalizeLanguage };
