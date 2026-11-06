#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative, extname } from "node:path";

const root = process.argv[2] ?? "../dsh-java-desktop/dist";

const scan_exts = new Set([".html", ".js", ".mjs"]);
const rules = [
  { re: /<script[^>]+src=["']https?:\/\//gi, msg: "远程 <script src>", blocking: true },
  { re: /\beval\s*\(/g, msg: "eval(", blocking: false },
  { re: /new\s+Function\s*\(/g, msg: "new Function", blocking: false },
  { re: /import\s*\(\s*["']https?:\/\//g, msg: "远程动态 import()", blocking: true },
  { re: /__TAURI_UPDATER__|hot-update\.json|hotupdate/gi, msg: "热更新入口", blocking: true },
];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const violations = [];
const warnings = [];
for (const file of await walk(root)) {
  if (!scan_exts.has(extname(file))) continue;
  const text = await readFile(file, "utf8");
  const rel = relative(root, file).split("\\").join("/");
  for (const rule of rules) {
    const hits = text.match(rule.re);
    if (!hits) continue;
    const entry = { file: rel, rule: rule.msg, count: hits.length };
    if (rule.blocking) violations.push(entry);
    else warnings.push(entry);
  }
}

if (warnings.length) {
  console.warn("提示：第三方库包含动态代码构造（CSP 未启用 unsafe-eval，运行时被阻断）：");
  for (const warning of warnings) {
    console.warn(`  - ${warning.file}: ${warning.rule} (${warning.count})`);
  }
}

if (violations.length) {
  console.error("产物安全检查失败：");
  for (const violation of violations) {
    console.error(`  - ${violation.file}: ${violation.rule} (${violation.count})`);
  }
  process.exit(1);
}

console.log("产物安全检查通过：无远程脚本、远程动态 import 或热更新入口");