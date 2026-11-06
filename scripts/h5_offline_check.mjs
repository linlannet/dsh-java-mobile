#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative, extname } from "node:path";

const root = process.argv[2] ?? "../dsh-java-desktop/dist";

const scan_exts = new Set([".html", ".css"]);
const rules = [
  { re: /<script[^>]+src=["']https?:\/\//gi, msg: "远程脚本" },
  { re: /<link[^>]+href=["']https?:\/\//gi, msg: "远程样式/资源" },
  { re: /url\(\s*["']?https?:\/\//gi, msg: "CSS 远程资源" },
  { re: /@import\s+["']?https?:\/\//gi, msg: "远程 @import" },
  { re: /<img[^>]+src=["']https?:\/\//gi, msg: "远程图片" },
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
for (const file of await walk(root)) {
  if (!scan_exts.has(extname(file))) continue;
  const text = await readFile(file, "utf8");
  const rel = relative(root, file).split("\\").join("/");
  for (const rule of rules) {
    const hits = text.match(rule.re);
    if (hits) violations.push({ file: rel, rule: rule.msg, count: hits.length });
  }
}

if (violations.length) {
  console.error("离线校验失败：产物存在外部 CDN 依赖");
  for (const violation of violations) {
    console.error(`  - ${violation.file}: ${violation.rule} (${violation.count})`);
  }
  process.exit(1);
}

console.log("离线校验通过：HTML/CSS 无外部 CDN 依赖");