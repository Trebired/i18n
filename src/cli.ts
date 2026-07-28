#!/usr/bin/env node

import {
  checkColocatedI18n,
  formatI18nCheckViolations,
} from "./checker/index.js";
import type { I18nCheckOptions } from "./checker/index.js";

type ParsedCli = {
  command: string;
  options: I18nCheckOptions;
};

const ORGANIZATION_CODES = [116, 114, 101, 98, 105, 114, 101, 100];
const CLI_NAME = `${packageOrganization()}-i18n`;

async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseCli(argv);
  if (parsed.command !== "check") {
    printHelp();
    process.exitCode = parsed.command ? 1 : 0;
    return;
  }

  const result = await checkColocatedI18n(parsed.options);
  if (result.ok) {
    console.log(`I18n check passed. folders=${result.checkedFolders}`);
    return;
  }

  console.error(formatI18nCheckViolations(result.violations, result.rootDir));
  process.exitCode = 1;
}

function parseCli(argv: string[]): ParsedCli {
  const command = argv[0] || "";
  const options: I18nCheckOptions = {};

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--root") options.rootDir = consumeValue(arg, value);
    else if (arg === "--languages") options.supportedLanguages = splitList(consumeValue(arg, value));
    else if (arg === "--default-language") options.defaultLanguage = consumeValue(arg, value);
    else if (arg === "--dir-name") options.dirName = consumeValue(arg, value);
    else if (arg === "--extension") options.extensions = splitList(consumeValue(arg, value));
    else if (arg === "--ignore-dir") options.ignoreDirs = [...(options.ignoreDirs || []), consumeValue(arg, value)];
    else if (arg === "--dir") options.dirs = [...toList(options.dirs), consumeValue(arg, value)];
    else if (arg === "--help" || arg === "-h") return { command: "", options };
    else throw new Error(`Unknown option: ${arg}`);
    index += 1;
  }

  return { command, options };
}

function consumeValue(flag: string, value: string | undefined): string {
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return value;
}

function splitList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function toList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function packageOrganization(): string {
  return ORGANIZATION_CODES.map((code) => String.fromCharCode(code)).join("");
}

function printHelp(): void {
  console.log([
    `Usage: ${CLI_NAME} check --root ./src --languages en,cs`,
    "",
    "Options:",
    "  --root <dir>",
    "  --languages <comma-list>",
    "  --default-language <language>",
    "  --dir-name <name>",
    "  --extension <extension>",
    "  --ignore-dir <name>",
    "  --dir <i18n-folder>",
  ].join("\n"));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/gu, "/"))) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export { runCli };
