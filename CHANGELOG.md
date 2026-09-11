# Changelog

## 0.7.2

- Updated the `@trebired/grammar` dependency to `^0.2.0`, which adds the `prep` pipe: `{{ table | prep:z }}` prints "z tabulky" or "ze sessions" in Czech. The checker reads the pipe list from grammar, so it accepts `prep` and no longer reports it as `i18n-unknown-pipe`.

## 0.7.1

- Changed the CLI to print through `@trebired/logger-adapter` instead of `console`, and added the `@trebired/logger-adapter` dependency. The check result, violations and help text now reach the application's logger when one is installed.
- Changed the verification scripts and examples to print through `@trebired/logger-adapter` instead of `console` and `process.stdout`.

## 0.7.0

- Added message pipes through `@trebired/grammar`: `{{ name | vocative }}`, every other grammatical case, `possessive`, `number`, `ordinal`, `list`, `article`, `upper`, `lower`, and `capitalize`, in both placeholder forms. A pipe runs in the language the message was found in, so a Czech greeting declines the name while the English fallback leaves it alone. Name variables may be objects (`{ full, gender }`) when the caller knows the gender.
- Added plural messages: a message may be an object of plural categories (`{ one, few, many, other }`), and `translate` picks the form for the `count` variable using the rules of the language the message was found in. `I18nMessageKey` treats a plural object as one key, and `I18nPluralMessage` and `I18nPluralCategory` are exported.
- Added two checker violations: `i18n-plural-categories` when a plural message lacks a category its language needs (Czech needs `one`, `few`, `many` and `other`; English `one` and `other`), and `i18n-unknown-pipe` for a pipe `@trebired/grammar` does not provide. Plural messages count as one key when languages are compared.
- Added the `@trebired/grammar` dependency.
- Kept placeholders without pipes byte-identical to 0.6: `{{count}}` still prints the raw value.

## 0.6.1

- Changed the `forVersion` check to pass the config object to `resolveForVersion()`, which `@trebired/utils` 0.9.0 requires. A config that does not declare `forVersion` as its first key now fails instead of loading.
- Updated the `@trebired/utils` dependency range to `^0.9.0`.
- Updated the shipped `.trebired/logger/config.ts` `forVersion` to `2.7.0` and the `@trebired/code-discipline` / `@trebired/configs` ranges to `^7.2.0` / `^0.4.0`. The logger config named an older release, so under `@trebired/logger` 2.7 the version check threw and this package's log prefix was dropped.

## 0.5.6

### Changed

- Moved the `@trebired/utils` dependency range from `^0.6.0` to `^0.8.0`, matching the rest of
  the `@trebired` packages. For 0.x versions those two ranges are disjoint (`>=0.6.0 <0.7.0` vs
  `>=0.8.0 <0.9.0`), so any project combining this package with one already on `^0.8.0`
  (`@trebired/frontend`, `@trebired/uploads`, `@trebired/env`, `@trebired/security`) resolved two
  copies of `@trebired/utils` — a hoisted 0.6.x alongside a nested 0.8.x — duplicating code and
  letting app-level imports of `@trebired/utils` silently resolve to a different copy than this
  package used internally. Nothing this package uses changed across those releases; the only
  breaking change in 0.8.0 was the env module moving to `@trebired/env`, which this package does
  not import.

## 0.5.5

- Removed dead `config.creator` from `package.json`.
- Updated shared utilities to `@trebired/utils@^0.6.0` and replaced the removed `readPackageIdentity()` with `readPackageJsonUrl()`. No change to `PACKAGE_VERSION` behavior.

## 0.5.2

- Updated shared utilities to `@trebired/utils@^0.4.4`.

All notable changes to `@trebired/i18n` will be documented here.

This project follows semantic versioning once published.

## 0.5.1

- Updated shared utilities to `@trebired/utils@^0.4.3`.
- Moved package version metadata resolution onto the shared package identity helper.

## 0.5.0

- Added generic language tag normalization, supported-language matching, preferred-language header parsing, and document language helpers to the root runtime API.

## 0.4.10

- Updated the shared Trebired config dependency to `@trebired/configs@^0.1.2`.

## 0.4.7

- Added `.trebired/i18n/config.ts` loading and normalization helpers through `@trebired/i18n/config`.
- Updated the CLI to consume project i18n config while still allowing explicit CLI options to override it.

## 0.4.6

- Adopted the external `@trebired/configs` preset and updated Code Discipline tooling to `@trebired/code-discipline@^6.0.9`.

## 0.4.5

- Updated the Code Discipline devDependency and lockfile to public `@trebired/code-discipline@^5.5.2`.
## 0.4.4

- Adopted the shared Trebired Code Discipline preset so package configs only keep repo-specific policy.
- Updated the Code Discipline devDependency and lockfile to public `@trebired/code-discipline@^5.5.1`.

## 0.4.3

- Updated the package Code Discipline config to the platform-aligned rule set, including formatting, redundant path segment cleanup, removable comment checks, structural blank lines, and dry checks.
- Updated the Code Discipline devDependency and lockfile to the current public `@trebired/code-discipline@^5.3.0`.

## 0.4.2

- Refreshed package dependency ranges with `bun update` after adopting the `.trebired/code-discipline` structure.

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
