#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const left = process.argv[2] ?? "h5-dist";
const right = process.argv[3] ?? "harmony/entry/src/main/resources/rawfile/h5";

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(relative(base, full).split("\\").join("/"));
  }
  return out.sort();
}

async function digest(dir, files) {
  const map = new Map();
  for (const file of files) {
    const buf = await readFile(join(dir, file));
    map.set(file, createHash("sha256").update(buf).digest("hex"));
  }
  return map;
}

const [left_files, right_files] = await Promise.all([walk(left), walk(right)]);

if (left_files.join(",") !== right_files.join(",")) {
  console.error("文件集合不一致：");
  console.error("  仅左存在：", left_files.filter((f) => !right_files.includes(f)));
  console.error("  仅右存在：", right_files.filter((f) => !left_files.includes(f)));
  process.exit(1);
}

const [left_hash, right_hash] = await Promise.all([digest(left, left_files), digest(right, right_files)]);
const mismatched = left_files.filter((file) => left_hash.get(file) !== right_hash.get(file));

if (mismatched.length) {
  console.error("文件哈希不一致：", mismatched);
  process.exit(1);
}

console.log(`内嵌/托管产物一致：${left_files.length} 个文件哈希完全相同`);