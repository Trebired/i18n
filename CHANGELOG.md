# Changelog

All notable changes to `@trebired/i18n` will be documented here.

This project follows semantic versioning once published.

## 0.1.0

- Added generic translation primitives for typed message dictionaries, bundles, language fallback, dot-key lookup, interpolation, translators, and source-level local translators.
- Added a colocated `i18n/` checker API under `@trebired/i18n/checker` and CLI for missing supported language files, unsupported files, key mismatches, and invalid TypeScript default exports.
- Kept the root `@trebired/i18n` entrypoint runtime-only so browser bundles do not import checker or CLI dependencies.
- Added Trebired package metadata, Code Discipline configuration, publish workflow, docs, and verification coverage.
