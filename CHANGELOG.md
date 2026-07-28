# Changelog

All notable changes to `@trebired/i18n` will be documented here.

This project follows semantic versioning once published.

## 0.2.0

- Kept the root entrypoint runtime-only and browser-safe by exposing checker APIs only from `@trebired/i18n/checker`.
- Added pack verification for exported subpaths and executable CLI output.

## 0.1.0

- Added generic translation primitives for typed message dictionaries, bundles, language fallback, dot-key lookup, interpolation, translators, and source-level local translators.
- Added a colocated `i18n/` checker API and CLI for missing supported language files, unsupported files, key mismatches, and invalid TypeScript default exports.
- Added Trebired package metadata, Code Discipline configuration, publish workflow, docs, and verification coverage.
