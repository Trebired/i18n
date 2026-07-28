# @trebired/i18n

Generic translation primitives and colocated TypeScript i18n checks for reusable packages and applications.

`@trebired/i18n` does not own a global dictionary, generated registry, JSON loader, framework adapter, or app language policy. Callers provide bundles directly, or pair the source-level `createLocalTranslator(import.meta.url, lang)` API with bundler support that rewrites it to static local imports.

The root entrypoint is runtime-only and browser-safe. Checker APIs live under `@trebired/i18n/checker`, and the CLI is exposed through the `trebired-i18n` bin.

## Install

Runtime support: Bun 1+ and Node.js 18+.

```sh
npm install @trebired/i18n
```

## Quick Start

Use plain local bundles:

```ts
import { createTranslator, defineMessages } from "@trebired/i18n";

const messages = {
  en: defineMessages({
    title: "Project {name}",
    status: {
      saved: "Saved",
    },
  }),
  cs: defineMessages({
    title: "Projekt {name}",
    status: {
      saved: "Ulozeno",
    },
  }),
};

const t = createTranslator(messages, "cs");

t("title", { name: "Atlas" });
t("status.saved");
```

With `@trebired/bundler` 3.6+, feature code can import only the central API while language files stay beside the feature:

```txt
some-feature/
  component.tsx
  i18n/
    en.ts
    cs.ts
```

```ts
import { createLocalTranslator } from "@trebired/i18n";

const t = createLocalTranslator(import.meta.url, lang);
```

Language files are pure TypeScript default exports:

```ts
import { defineMessages } from "@trebired/i18n";

export default defineMessages({
  title: "Title",
});
```

There is no local `i18n/index.ts`, JSON file, app-wide registry, or checked-in generated source file.

## Translation Rules

- exact flat keys are checked first
- nested dot keys are checked next
- the selected language wins when it has the key
- regional language tags fall back to their base tag before English
- missing selected-language keys fall back to English
- missing keys in all languages return the key string
- `{name}` and `{{ name }}` interpolation both use the variables object

```ts
import { translate } from "@trebired/i18n";

translate(bundle, "cs-CZ", "form.title", { count: 3 });
```

## Checker API

Run the checker over a source tree with colocated `i18n/` folders:

```ts
import { assertColocatedI18n } from "@trebired/i18n/checker";

await assertColocatedI18n({
  rootDir: "./src",
  supportedLanguages: ["en", "cs"],
});
```

The checker fails when:

- a supported language file is missing from any discovered `i18n/` folder
- a file in an `i18n/` folder is not one of the supported language files
- languages do not expose the same flattened keys as English
- a language file does not default-export `defineMessages({ ... })`
- message values are not strings or nested message objects

When `supportedLanguages` is omitted, the checker infers languages from each folder but still requires the English fallback file.

## CLI

```sh
trebired-i18n check --root ./src --languages en,cs
```

Useful options:

- `--root ./src`
- `--languages en,cs`
- `--default-language en`
- `--dir-name i18n`
- `--extension .ts`
- `--ignore-dir generated`

The CLI prints every violation before exiting with status 1.
