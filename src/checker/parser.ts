import fs from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

import type { I18nDictionary } from "#dtqts236bejn";

type I18nMessageParseErrorOptions = {
  column: number;
  filePath: string;
  line: number;
  reason: string;
};

class I18nMessageParseError extends Error {
  readonly column: number;
  readonly filePath: string;
  readonly line: number;
  readonly reason: string;

  constructor(options: I18nMessageParseErrorOptions) {
    super(`${options.reason} :: ${options.filePath}:${options.line}:${options.column}`);
    this.name = "I18nMessageParseError";
    this.column = options.column;
    this.filePath = options.filePath;
    this.line = options.line;
    this.reason = options.reason;
  }
}

async function parseMessagesFile(filePath: string): Promise<I18nDictionary> {
  return parseMessagesSource(await fs.readFile(filePath, "utf8"), filePath);
}

function parseMessagesSource(source: string, filePath = "messages.ts"): I18nDictionary {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    resolveScriptKind(filePath),
  );

  assertParsableSource(sourceFile, filePath);
  return parseMessagesObject(resolveDefaultMessagesArgument(sourceFile, filePath), sourceFile, filePath);
}

function assertParsableSource(sourceFile: ts.SourceFile, filePath: string): void {
  const diagnostics = (sourceFile as ts.SourceFile& {
      parseDiagnostics?: readonly ts.Diagnostic[];
  }).parseDiagnostics || [];
  const [diagnostic] = diagnostics;
  if (!diagnostic) return;

  const reason = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  failAtPosition(sourceFile, filePath, diagnostic.start || 0, `invalid TypeScript syntax: ${reason}`);
}

function resolveDefaultMessagesArgument(sourceFile: ts.SourceFile, filePath: string): ts.Expression {
  for (const statement of sourceFile.statements) {
    const expression = resolveDefaultExportExpression(statement);
    if (!expression) continue;

    const call = unwrapParentheses(expression);
    if (!ts.isCallExpression(call) || !isDefineMessagesIdentifier(call.expression)) {
      failAtNode(sourceFile, filePath, expression, "expected default export defineMessages({...})");
    }

    const [messages] = call.arguments;
    if (!messages || call.arguments.length !== 1) {
      failAtNode(sourceFile, filePath, call, "expected default export defineMessages({...})");
    }

    return unwrapParentheses(messages);
  }

  failAtPosition(sourceFile, filePath, 0, "expected default export defineMessages({...})");
}

function resolveDefaultExportExpression(statement: ts.Statement): ts.Expression | undefined {
  if (!ts.isExportAssignment(statement) || statement.isExportEquals) return undefined;
  return statement.expression;
}

function parseMessagesObject(
  expression: ts.Expression,
  sourceFile: ts.SourceFile,
  filePath: string,
): I18nDictionary {
  if (!ts.isObjectLiteralExpression(expression)) {
    failAtNode(sourceFile, filePath, expression, "expected messages object literal");
  }

  const messages: Record<string, string|I18nDictionary> = {};
  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property)) {
      failAtNode(sourceFile, filePath, property, "message objects only support property assignments");
    }
    messages[parsePropertyKey(property.name, sourceFile, filePath)] = parseMessageValue(
      unwrapParentheses(property.initializer),
      sourceFile,
      filePath,
    );
  }
  return messages;
}

function parseMessageValue(
  expression: ts.Expression,
  sourceFile: ts.SourceFile,
  filePath: string,
): string | I18nDictionary {
  if (ts.isObjectLiteralExpression(expression)) return parseMessagesObject(expression, sourceFile, filePath);
  return parseStaticStringExpression(expression, sourceFile, filePath);
}

function parseStaticStringExpression(
  expression: ts.Expression,
  sourceFile: ts.SourceFile,
  filePath: string,
): string {
  const unwrapped = unwrapParentheses(expression);
  if (ts.isStringLiteral(unwrapped) || ts.isNoSubstitutionTemplateLiteral(unwrapped)) return unwrapped.text;
  if (ts.isTemplateExpression(unwrapped)) {
    failAtNode(sourceFile, filePath, unwrapped, "template expressions are not supported");
  }
  if (ts.isBinaryExpression(unwrapped) && unwrapped.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return [
      parseStaticStringExpression(unwrapped.left, sourceFile, filePath),
      parseStaticStringExpression(unwrapped.right, sourceFile, filePath),
    ].join("");
  }
  failAtNode(sourceFile, filePath, unwrapped, `unsupported static expression: ${formatSyntaxKind(unwrapped.kind)}`);
}

function parsePropertyKey(name: ts.PropertyName, sourceFile: ts.SourceFile, filePath: string): string {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  failAtNode(sourceFile, filePath, name, "unsupported message key");
}

function isDefineMessagesIdentifier(expression: ts.Expression): boolean {
  return ts.isIdentifier(expression) && expression.text === "defineMessages";
}

function unwrapParentheses(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
}

function failAtNode(sourceFile: ts.SourceFile, filePath: string, node: ts.Node, reason: string): never {
  failAtPosition(sourceFile, filePath, node.getStart(sourceFile), reason);
}

function failAtPosition(sourceFile: ts.SourceFile, filePath: string, position: number, reason: string): never {
  const location = sourceFile.getLineAndCharacterOfPosition(position);
  throw new I18nMessageParseError({
      column: location.character + 1,
      filePath,
      line: location.line + 1,
      reason,
  });
}

function formatSyntaxKind(kind: ts.SyntaxKind): string {
  return ts.SyntaxKind[kind] || "unknown";
}

function resolveScriptKind(filePath: string): ts.ScriptKind {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".tsx") return ts.ScriptKind.TSX;
  if (extension === ".jsx") return ts.ScriptKind.JSX;
  if (extension === ".ts" || extension === ".mts" || extension === ".cts") return ts.ScriptKind.TS;
  if (extension === ".js" || extension === ".mjs" || extension === ".cjs") return ts.ScriptKind.JS;
  return ts.ScriptKind.Unknown;
}

export {
  I18nMessageParseError,
  parseMessagesFile,
  parseMessagesSource,
};
