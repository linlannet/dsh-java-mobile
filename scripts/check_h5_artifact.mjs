#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { createHash } from "node:crypto";

const root = process.argv[2] ?? "dist";

const scan_exts = new Set([".html", ".js", ".mjs", ".css"]);
const forbidden = [
  { re: /(?:src|href)\s*=\s*["']\/(?!\/)/g, msg: '绝对路径引用 src|href="/', exts: [".html"] },
  { re: /url\(\s*["']?\//g, msg: "CSS url(/...) 绝对路径", exts: [".html", ".css"] },
  { re: /file:\/\//g, msg: "file:// 引用", exts: [".html", ".css"] },
  { re: /(?:fetch|import|new\s+Worker)\s*\(\s*["']file:\/\//g, msg: "JS 加载 file://", exts: [".js", ".mjs"] },
  { re: /\/Users\//g, msg: "本地用户绝对路径" },
  { re: /[A-Za-z]:\\\\/g, msg: "Windows 绝对路径" },
  { re: /sourceMappingURL=/g, msg: "sourcemap 残留" },
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

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

const files = [];
const violations = [];

for (const file of await walk(root)) {
  const buf = await readFile(file);
  const rel = relative(root, file).split("\\").join("/");
  files.push({ path: rel, bytes: buf.length, sha256: sha256(buf) });

  if (!scan_exts.has(extname(file))) continue;
  const text = buf.toString("utf8");
  for (const rule of forbidden) {
    if (rule.exts && !rule.exts.includes(extname(file))) continue;
    const hits = text.match(rule.re);
    if (hits) violations.push({ file: rel, rule: rule.msg, count: hits.length });
  }
}

files.sort((a, b) => a.path.localeCompare(b.path));

const manifest = {
  root,
  generated_at: new Date().toISOString(),
  files,
  total_bytes: files.reduce((s, f) => s + f.bytes, 0),
};

await writeFile(join(root, "artifact_manifest.json"), JSON.stringify(manifest, null, 2));

if (violations.length) {
  console.error("产物检查失败，发现违规：");
  for (const v of violations) console.error(`  - ${v.file}: ${v.rule} (${v.count})`);
  process.exit(1);
}

console.log(`产物检查通过：${files.length} 个文件，共 ${manifest.total_bytes} 字节`);