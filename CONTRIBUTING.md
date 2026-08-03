# Contributing

Thanks for helping improve `@trebired/i18n`.

## Development Setup

```sh
bun install
```

The package is authored in TypeScript and published from `dist`. Generated outputs, package tarballs, temp folders, logs, and caches stay out of Git.

## Common Commands

```sh
bun install --frozen-lockfile
bunx @trebired/code-discipline check
bun run typecheck
bun run build
bun run verify:pack
bun run verify:i18n
```

Committed `*.spec.ts` and `*.spec.tsx` files are banned by Code Discipline. Verification scripts create their own temporary fixtures.

## Pull Request Checklist

- Keep public API changes intentional and documented in `README.md`.
- Run Code Discipline, typecheck, build, and package verification when present.
- Update `CHANGELOG.md` under the current version or a new version section.
- Do not commit `dist`, package tarballs, temp folders, logs, or caches.

## Code Discipline

- Keep the config at `.trebired/code-discipline/config.ts`.
- Use `syncImports.output.type: "alias-map"`.
- Keep `allowRelative: ["./"]`.
- Do not add rule-level excludes to bypass discipline.
- Keep `@trebired/code-discipline` in `devDependencies`.
- Keep hardcoded `trebired` strings out of source files unless the package config explicitly allows the file.

## Design Principles

- Keep translation primitives independent of frameworks and renderers.
- Keep language files as pure TypeScript default exports.
- Keep colocated i18n checks deterministic and easy to run in CI.
- Avoid registries, generated source files, JSON dictionaries, and app-specific conventions.
