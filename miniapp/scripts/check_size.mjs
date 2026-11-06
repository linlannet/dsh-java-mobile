#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.argv[2] ?? "dist";
const MAIN_LIMIT = 2 * 1024 * 1024;
const SUB_LIMIT = 2 * 1024 * 1024;
const TOTAL_LIMIT = 20 * 1024 * 1024;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function exists(path) {
  return stat(path).then(() => true).catch(() => false);
}

if (!(await exists(root))) {
  console.warn(`未找到 ${root}，请先执行 npm run build:weapp 后再运行本门禁`);
  process.exit(0);
}

const app_json = JSON.parse(await readFile(join(root, "app.json"), "utf8").catch(() => "{}"));
const sub_roots = (app_json.subPackages ?? []).map((pkg) => pkg.root).filter(Boolean);

const files = await walk(root);
let main_bytes = 0;
const sub_bytes = new Map(sub_roots.map((root) => [root, 0]));
let total_bytes = 0;

for (const file of files) {
  const size = (await stat(file)).size;
  const rel = relative(root, file).split("\\").join("/");
  total_bytes += size;
  const matched = sub_roots.find((sub) => rel === sub || rel.startsWith(`${sub}/`));
  if (matched) sub_bytes.set(matched, (sub_bytes.get(matched) ?? 0) + size);
  else main_bytes += size;
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
console.log(`主包：${mb(main_bytes)} / 限额 ${mb(MAIN_LIMIT)}`);
for (const [root, bytes] of sub_bytes) {
  console.log(`分包 ${root}：${mb(bytes)} / 限额 ${mb(SUB_LIMIT)}`);
}
console.log(`总计：${mb(total_bytes)} / 限额 ${mb(TOTAL_LIMIT)}`);

let failed = false;
if (main_bytes > MAIN_LIMIT) {
  console.error("主包超限");
  failed = true;
}
for (const [root, bytes] of sub_bytes) {
  if (bytes > SUB_LIMIT) {
    console.error(`分包 ${root} 超限`);
    failed = true;
  }
}
if (total_bytes > TOTAL_LIMIT) {
  console.error("总包体超限");
  failed = true;
}

if (failed) process.exit(1);
console.log("小程序包体门禁通过");