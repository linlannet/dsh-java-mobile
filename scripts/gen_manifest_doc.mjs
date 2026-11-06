#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2] ?? "../dsh-java-desktop/dist";
const out = process.argv[3] ?? "docs/specs/mobile_app_evolution/artifact_manifest.md";

const meta = JSON.parse(await readFile(join(root, "artifact_meta.json"), "utf8"));

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const lines = [
  "# H5 产物清单",
  "",
  "> 由 `scripts/gen_manifest_doc.mjs` 依据 `artifact_meta.json` 生成，请勿手工编辑。",
  "",
  "## 产物元数据",
  "",
  "| 项 | 值 |",
  "| --- | --- |",
  `| artifact_version | ${meta.artifact_version} |`,
  `| contract_version | ${meta.contract_version} |`,
  `| min_bridge_version | ${meta.min_bridge_version} |`,
  `| built_at | ${meta.built_at} |`,
  `| commit | ${meta.commit} |`,
  `| content_hash | \`${meta.content_hash}\` |`,
  `| total_bytes | ${meta.total_bytes}（${kb(meta.total_bytes)}） |`,
  `| files | ${meta.files.length} |`,
  "",
  "## 文件清单",
  "",
  "| 相对路径 | 字节 | SHA-256（前 12 位） |",
  "| --- | --- | --- |",
  ...meta.files.map(
    (file) => `| \`${file.path}\` | ${file.bytes} | \`${file.sha256.slice(0, 12)}\` |`,
  ),
  "",
  "## 排除项",
  "",
  "- sourcemap（构建已关闭）",
  "- 测试 fixtures 与测试数据",
  "- 本地绝对路径、用户名、`file://` 引用",
  "",
];

await writeFile(out, lines.join("\n"));
console.log(`已生成 ${out}（${meta.files.length} 个文件）`);