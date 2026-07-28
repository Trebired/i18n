import fs from "node:fs/promises";
import path from "node:path";

import type { NormalizedI18nCheckOptions } from "./types.js";

async function findI18nFolders(options: NormalizedI18nCheckOptions): Promise<string[]> {
  if (options.dirs.length > 0) return options.dirs;

  const folders: string[] = [];
  await walkDirectory(options.rootDir, options, folders);
  return folders.sort();
}

async function walkDirectory(
  currentDir: string,
  options: NormalizedI18nCheckOptions,
  folders: string[],
): Promise<void> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (options.ignoreDirs.has(entry.name)) continue;
    const nextDir = path.join(currentDir, entry.name);
    if (entry.name === options.dirName) {
      folders.push(nextDir);
      continue;
    }
    await walkDirectory(nextDir, options, folders);
  }
}

export { findI18nFolders };
