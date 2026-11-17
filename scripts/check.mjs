import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectories = new Set(['.git', '.local', 'node_modules']);

async function collectModules(directory) {
  const modules = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
      modules.push(...(await collectModules(fullPath)));
    } else if (entry.isFile() && ['.js', '.mjs'].includes(extname(entry.name))) {
      modules.push(fullPath);
    }
  }
  return modules.sort();
}

const modules = await collectModules(projectRoot);
for (const modulePath of modules) {
  const result = spawnSync(process.execPath, ['--check', modulePath], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Syntax checked ${modules.length} JavaScript modules.`);
