import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const tempRoot = path.join(rootDir, ".tmp", "verify-i18n");
const organizationCodes = [116, 114, 101, 98, 105, 114, 101, 100];
const packageImport = `@${packageOrganization()}/i18n`;
const runtime = await import(packageImport);
const checker = await import(`${packageImport}/checker`);
const {
  createTranslator,
  defineMessages,
  translate,
} = runtime;
const {
  checkColocatedI18n,
} = checker;

async function main() {
  await resetTempRoot();
  await verifyRuntimeEntryIsBrowserSafe();
  verifyRootRuntimeExports();
  verifyTranslationRuntime();
  await verifyCheckerSuccess();
  await verifyCheckerFailures();
  await verifyBuiltCliExecutable();
  console.log("I18n verification succeeded.");
}

async function verifyRuntimeEntryIsBrowserSafe() {
  const visited = new Set();
  await walkRuntimeGraph(path.join(rootDir, "dist", "index.js"), visited);
}

async function walkRuntimeGraph(filePath, visited) {
  const resolved = path.resolve(filePath);
  if (visited.has(resolved)) return;
  visited.add(resolved);

  const source = await fs.readFile(resolved, "utf8");
  for (const specifier of findImportSpecifiers(source)) {
    assert.equal(isNodeBuiltinSpecifier(specifier), false, `runtime import resolves Node builtin: ${specifier}`);
    assert.equal(specifier.includes("/checker") || specifier.includes("/cli"), false, `runtime import reaches ${specifier}`);
    if (specifier.startsWith(".")) await walkRuntimeGraph(path.resolve(path.dirname(resolved), specifier), visited);
  }
}

function verifyRootRuntimeExports() {
  for (const checkerName of ["assertColocatedI18n", "checkColocatedI18n", "runCli"]) {
    assert.equal(Object.prototype.hasOwnProperty.call(runtime, checkerName), false);
  }
}

function verifyTranslationRuntime() {
  const bundle = {
    en: defineMessages({
      flat: "Flat {name}",
      nested: {
        title: "Title {{ name }}",
      },
      "status.saved": "Saved",
    }),
    cs: defineMessages({
      flat: "Plocha {name}",
      nested: {},
      "status.saved": "Ulozeno",
    }),
  };

  assert.equal(translate(bundle, "cs", "flat", { name: "Ada" }), "Plocha Ada");
  assert.equal(translate(bundle, "cs", "nested.title", { name: "Ada" }), "Title Ada");
  assert.equal(translate(bundle, "cs", "status.saved"), "Ulozeno");
  assert.equal(translate(bundle, "fr", "flat", { name: "Ada" }), "Flat Ada");
  assert.equal(translate(bundle, "cs", "missing.key"), "missing.key");

  const t = createTranslator(bundle, "en");
  assert.equal(t("nested.title", { name: "Ada" }), "Title Ada");
}

async function verifyCheckerSuccess() {
  const featureDir = path.join(tempRoot, "success", "feature", "i18n");
  await writeLanguageFile(featureDir, "en", {
    nested: { title: "Title" },
    "status.saved": "Saved",
  });
  await writeLanguageFile(featureDir, "cs", {
    nested: { title: "Titulek" },
    "status.saved": "Ulozeno",
  });

  const result = await checkColocatedI18n({
    rootDir: path.join(tempRoot, "success"),
    supportedLanguages: ["en", "cs"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.checkedFolders, 1);
}

async function verifyCheckerFailures() {
  await assertCheckerFails("missing", async (dir) => {
    await writeLanguageFile(path.join(dir, "feature", "i18n"), "en", { title: "Title" });
  }, "i18n-missing-language-file");

  await assertCheckerFails("unsupported", async (dir) => {
    const folder = path.join(dir, "feature", "i18n");
    await writeLanguageFile(folder, "en", { title: "Title" });
    await writeLanguageFile(folder, "cs", { title: "Titulek" });
    await writeLanguageFile(folder, "fr", { title: "Titre" });
  }, "i18n-unsupported-language-file");

  await assertCheckerFails("mismatch", async (dir) => {
    const folder = path.join(dir, "feature", "i18n");
    await writeLanguageFile(folder, "en", { title: "Title", action: "Save" });
    await writeLanguageFile(folder, "cs", { title: "Titulek" });
  }, "i18n-key-mismatch");

  await assertCheckerFails("invalid", async (dir) => {
    const folder = path.join(dir, "feature", "i18n");
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, "en.ts"), "export default { title: \"Title\" };\n");
    await writeLanguageFile(folder, "cs", { title: "Titulek" });
  }, "i18n-invalid-default-export");
}

async function assertCheckerFails(name, writeFixture, expectedCode) {
  const dir = path.join(tempRoot, name);
  await writeFixture(dir);
  const result = await checkColocatedI18n({
    rootDir: dir,
    supportedLanguages: ["en", "cs"],
  });
  assert.equal(result.ok, false);
  assert.equal(result.violations.some((violation) => violation.code === expectedCode), true);
}

async function resetTempRoot() {
  await fs.rm(tempRoot, { force: true, recursive: true });
  await fs.mkdir(tempRoot, { recursive: true });
}

async function verifyBuiltCliExecutable() {
  const stats = await fs.stat(path.join(rootDir, "dist", "cli.js"));
  assert.notEqual(stats.mode & 0o111, 0, "dist/cli.js should be executable");
}

function findImportSpecifiers(source) {
  const specifiers = [];
  const pattern = /(?:import|export)\s+(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/gu;
  let match;
  while ((match = pattern.exec(source))) specifiers.push(match[1] || match[2]);
  return specifiers;
}

function isNodeBuiltinSpecifier(specifier) {
  const normalized = specifier.startsWith("node:") ? specifier.slice(5) : specifier;
  return builtinModules.includes(normalized) || builtinModules.includes(`node:${normalized}`);
}

function packageOrganization() {
  return organizationCodes.map((code) => String.fromCharCode(code)).join("");
}

async function writeLanguageFile(folder, language, messages) {
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, `${language}.ts`), [
    `import { defineMessages } from ${JSON.stringify(packageImport)};`,
    "",
    `export default defineMessages(${JSON.stringify(messages, null, 2)});`,
    "",
  ].join("\n"));
}

await main();
