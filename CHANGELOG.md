# Changelog

All notable changes to `@trebired/i18n` will be documented here.

This project follows semantic versioning once published.

## 0.4.1

- Moved Code Discipline config, alias-map state, generated tsconfig paths, and reports to `.trebired/code-discipline/`.
- Updated the `@trebired/code-discipline` devDependency to `^4.10.0`.

## 0.4.0

- Updated Code Discipline configuration to the `imports` rule with dead import removal enabled.
- Prepared the i18n package release line for consumers using the current Code Discipline imports gate.

## 0.3.1

- Standardized package metadata (author field, config-driven organization name, dropped the Node engine constraint) and migrated `.code-discipline/config.ts` to `defineCodeDisciplineConfig`.
- Normalized README structure and removed the license footer.

## 0.3.0

- Moved colocated message-file parsing onto the checker API as the package-owned source of truth for static TypeScript message files.
- Added support for static string expressions in `defineMessages()` files, including plain literals, no-substitution template literals, parenthesized expressions, and string concatenation across whitespace or comments.
- Kept dynamic message expressions rejected with clearer file, line, column, and reason diagnostics.
- Exported `flattenMessageKeys()` from `@trebired/i18n/checker` for tools that need checker-owned key normalization.
- Prepared Code Discipline generated path metadata before typecheck/build scripts so fresh checkouts work with generated files ignored.

## 0.2.0

- Kept the root entrypoint runtime-only and browser-safe by exposing checker APIs only from `@trebired/i18n/checker`.
- Added pack verification for exported subpaths and executable CLI output.

## 0.1.0

- Added generic translation primitives for typed message dictionaries, bundles, language fallback, dot-key lookup, interpolation, translators, and source-level local translators.
- Added a colocated `i18n/` checker API and CLI for missing supported language files, unsupported files, key mismatches, and invalid TypeScript default exports.
- Added Trebired package metadata, Code Discipline configuration, publish workflow, docs, and verification coverage.
