import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

import { flattenMessageKeys } from "./keys.js";
import { parseMessagesFile } from "./parser.js";
import type { I18nCheckViolation, NormalizedI18nCheckOptions } from "./types.js";

type Bindings = Map<ts.Symbol, Set<string>>;
type KeyCache = Map<string, Set<string>|null>;

const LOCAL_FACTORY = "createLocalTranslator";
const MAX_PASSES = 12;

function loadProgram(rootDir: string, tsconfig?: string): ts.Program | null {
  const configPath = tsconfig ? path.resolve(rootDir, tsconfig) : ts.findConfigFile(rootDir, ts.sys.fileExists, "tsconfig.json");
  if (!configPath || !fs.existsSync(configPath)) return null;
  const read = ts.readConfigFile(configPath, ts.sys.readFile);
  if (read.error) return null;
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(configPath));
  return ts.createProgram({ options: { ...parsed.options, noEmit: true }, rootNames: parsed.fileNames });
}

function isImportMetaUrl(node: ts.Node | undefined): boolean {
  return Boolean(node) && ts.isPropertyAccessExpression(node as ts.Node)
  &&ts.isMetaProperty((node as ts.PropertyAccessExpression).expression)
  &&(node as ts.PropertyAccessExpression).name.text === "url";
}

function resolvedSymbol(checker: ts.TypeChecker, node: ts.Node): ts.Symbol | undefined {
  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol) return undefined;
  return symbol.flags&ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

function bind(bindings: Bindings, symbol: ts.Symbol | undefined, folders: Iterable<string>): boolean {
  if (!symbol) return false;
  const current = bindings.get(symbol) ?? new Set<string>();
  const before = current.size;
  for (const folder of folders) current.add(folder);
  bindings.set(symbol, current);
  return current.size !== before;
}

function bindLocalTranslators(program: ts.Program, checker: ts.TypeChecker, files: ts.SourceFile[], dirName: string): Bindings {
  const bindings: Bindings = new Map();
  for (const file of files) {
    const folder = path.join(path.dirname(file.fileName), dirName);
    const visit = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
        const call = node.initializer;
        if (ts.isIdentifier(call.expression) && call.expression.text === LOCAL_FACTORY && isImportMetaUrl(call.arguments[0])) {
          bind(bindings, checker.getSymbolAtLocation(node.name), [folder]);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  void program;
  return bindings;
}

function calleeParameters(checker: ts.TypeChecker, call: ts.CallExpression): readonly ts.ParameterDeclaration[] | null {
  const symbol = resolvedSymbol(checker, call.expression);
  const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
  if (!declaration) return null;
  if (ts.isFunctionDeclaration(declaration) || ts.isMethodDeclaration(declaration)) return declaration.parameters;
  if (ts.isVariableDeclaration(declaration) && declaration.initializer
    &&(ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
    return declaration.initializer.parameters;
  }
  return null;
}

function propagate(checker: ts.TypeChecker, files: ts.SourceFile[], bindings: Bindings): void {
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    let changed = false;
    for (const file of files) {
      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node)) {
          const parameters = calleeParameters(checker, node);
          node.arguments.forEach((argument, index) => {
              const parameter = parameters?.[index];
              if (!parameter || !ts.isIdentifier(argument) || !ts.isIdentifier(parameter.name)) return;
              const folders = bindings.get(checker.getSymbolAtLocation(argument) as ts.Symbol);
              if (folders && bind(bindings, checker.getSymbolAtLocation(parameter.name), folders)) changed = true;
          });
        }
        ts.forEachChild(node, visit);
      };
      visit(file);
    }
    if (!changed) return;
  }
}

async function folderKeys(cache: KeyCache, folder: string, options: NormalizedI18nCheckOptions): Promise<Set<string>|null> {
  if (cache.has(folder)) return cache.get(folder) ?? null;
  const candidates = options.extensions.map((extension) => path.join(folder, `${options.defaultLanguage}${extension}`));
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  const keys = file ? new Set(flattenMessageKeys(await parseMessagesFile(file).catch (() => ({})))) : null;
  cache.set(folder, keys);
  return keys;
}

function literalKey(call: ts.CallExpression): string | null {
  const first = call.arguments[0];
  if (!first) return null;
  if (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) return first.text;
  return null;
}

async function unknownKeyViolations(
  checker: ts.TypeChecker,
  files: ts.SourceFile[],
  bindings: Bindings,
  options: NormalizedI18nCheckOptions,
): Promise<I18nCheckViolation[]> {
  const cache: KeyCache = new Map();
  const found: { call: ts.CallExpression; file: ts.SourceFile; folders: Set<string>; key: string }[] = [];
  for (const file of files) {
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const folders = bindings.get(checker.getSymbolAtLocation(node.expression) as ts.Symbol);
        const key = folders ? literalKey(node) : null;
        if (folders && key !== null) found.push({ call: node, file, folders, key });
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  const violations: I18nCheckViolation[] = [];
  for (const item of found) {
    for (const folder of item.folders) {
      const keys = await folderKeys(cache, folder, options);
      if (!keys || keys.has(item.key)) continue;
      const position = item.file.getLineAndCharacterOfPosition(item.call.getStart(item.file));
      violations.push({
          code: "i18n-unknown-key",
          column: position.character + 1,
          filePath: item.file.fileName,
          folderPath: folder,
          line: position.line + 1,
          message: `"${item.key}" is not a key in this folder, so the translator would show the key itself`,
      });
    }
  }
  return violations;
}

async function checkTranslationKeys(options: NormalizedI18nCheckOptions, tsconfig?: string): Promise<I18nCheckViolation[]> {
  const program = loadProgram(options.rootDir, tsconfig);
  if (!program) return [];
  const checker = program.getTypeChecker();
  const roots = options.dirs.length ? options.dirs : [options.rootDir];
  const inside = (file: ts.SourceFile) => roots.some((root) => {
      const relative = path.relative(root, path.resolve(file.fileName));
      return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative)
      &&!relative.split(path.sep).some((segment) => options.ignoreDirs.has(segment));
  });
  const files = program.getSourceFiles().filter((file) => !file.isDeclarationFile && inside(file));
  const bindings = bindLocalTranslators(program, checker, files, options.dirName);
  propagate(checker, files, bindings);
  return await unknownKeyViolations(checker, files, bindings, options);
}

export { checkTranslationKeys };
