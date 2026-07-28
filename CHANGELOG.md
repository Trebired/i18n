# Changelog

All notable changes to `@trebired/i18n` will be documented here.

This project follows semantic versioning once published.

## 0.3.0

- Moved colocated message-file parsing onto the checker API as the package-owned source of truth for static TypeScript message files.
- Added support for static string expressions in `defineMessages()` files, including plain literals, no-substitution template literals, parenthesized expressions, and string concatenation across whitespace or comments.
- Kept dynamic message expressions rejected with clearer file, line, column, and reason diagnostics.
- Exported `flattenMessageKeys()` from `@trebired/i18n/checker` for tools that need checker-owned key normalization.

## 0.2.0

- Kept the root entrypoint runtime-only and browser-safe by exposing checker APIs only from `@trebired/i18n/checker`.
- Added pack verification for exported subpaths and executable CLI output.

## 0.1.0

- Added generic translation primitives for typed message dictionaries, bundles, language fallback, dot-key lookup, interpolation, translators, and source-level local translators.
- Added a colocated `i18n/` checker API and CLI for missing supported language files, unsupported files, key mismatches, and invalid TypeScript default exports.
- Added Trebired package metadata, Code Discipline configuration, publish workflow, docs, and verification coverage.
