#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const root = process.argv[2] ?? "../dsh-java-desktop/dist";
const first_screen_limit = Number(process.argv[3] ?? 1_000_000);
const total_limit = Number(process.argv[4] ?? 4_000_000);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const sizes = new Map();
for (const file of await walk(root)) {
  const rel = relative(root, file).split("\\").join("/");
  if (rel === "artifact_meta.json" || rel === "artifact_manifest.json") continue;
  sizes.set(rel, gzipSync(await readFile(file)).length);
}

const index = await readFile(join(root, "index.html"), "utf8");
const refs = [...index.matchAll(/(?:src|href)="\.\/([^"]+)"/g)]
  .map((match) => match[1].split("?")[0])
  .filter((path) => path && path !== "dsh-icon.png");

const first_screen = ["index.html", ...new Set(refs)];
const first_bytes = first_screen.reduce((sum, path) => sum + (sizes.get(path) ?? 0), 0);
const total_bytes = [...sizes.values()].reduce((sum, value) => sum + value, 0);

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
console.log(`首屏关键资源（gzip）：${kb(first_bytes)} / 限额 ${kb(first_screen_limit)}`);
console.log(`完整产物（gzip）：${kb(total_bytes)} / 限额 ${kb(total_limit)}`);
console.log(`首屏文件：${first_screen.join(", ")}`);

if (first_bytes > first_screen_limit) {
  console.error("首屏体积超标");
  process.exit(1);
}

if (total_bytes > total_limit) {
  console.error("完整产物体积超标");
  process.exit(1);
}

console.log("产物体积门禁通过");