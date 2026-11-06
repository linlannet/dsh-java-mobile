#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const baseline_path = process.argv[2] ?? "../dsh-java-desktop/dist/artifact_meta.json";
const archives = process.argv.slice(3);

const baseline = JSON.parse(await readFile(baseline_path, "utf8"));
console.log(`基准产物：${baseline_path}（content_hash=${baseline.content_hash.slice(0, 12)}…）`);

if (archives.length === 0) {
  console.log("未提供三端产物（APK/AAB/IPA/HAP），跳过比对。");
  console.log("说明：需 Android SDK / Xcode / DevEco 构建后再执行：");
  console.log("  node scripts/verify_artifact_consistency.mjs <desktop artifact_meta.json> <app.apk> <app.ipa> <app.hap>");
  process.exit(0);
}

function find_meta_path(archive) {
  const list = execFileSync("unzip", ["-l", archive], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const line = list
    .split("\n")
    .find((item) => item.includes("artifact_meta.json"));
  if (!line) return null;
  return line.trim().split(/\s+/).pop();
}

function read_meta(archive) {
  const path = find_meta_path(archive);
  if (!path) return null;
  const raw = execFileSync("unzip", ["-p", archive, path], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

let failed = 0;

for (const archive of archives) {
  try {
    const meta = read_meta(archive);
    if (!meta) {
      failed += 1;
      console.error(`FAIL  ${archive}: 未找到 artifact_meta.json`);
      continue;
    }

    const hash_ok = meta.content_hash === baseline.content_hash;
    const baseline_files = baseline.files.map((file) => `${file.path}:${file.sha256}`).join("\n");
    const actual_files = (meta.files ?? []).map((file) => `${file.path}:${file.sha256}`).join("\n");
    const files_ok = baseline_files === actual_files;

    if (hash_ok && files_ok) {
      console.log(`PASS  ${archive}: content_hash=${meta.content_hash.slice(0, 12)}…，文件清单一致`);
    } else {
      failed += 1;
      console.error(
        `FAIL  ${archive}: hash ${hash_ok ? "一致" : "不一致"}，文件清单 ${files_ok ? "一致" : "不一致"}`,
      );
    }
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${archive}: ${error instanceof Error ? error.message : error}`);
  }
}

if (failed > 0) {
  console.error(`\n产物一致性校验失败：${failed} 项`);
  process.exit(1);
}

console.log("\n产物一致性校验通过");