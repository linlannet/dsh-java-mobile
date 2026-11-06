#!/usr/bin/env node
import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";

const src = process.argv[2] ?? "../dsh-java-desktop/dist";
const targets = [process.argv[3] ?? "h5-dist", process.argv[4] ?? "harmony/entry/src/main/resources/rawfile/h5"].filter(Boolean);

for (const target of targets) {
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(src, target, { recursive: true });
  console.log(`已投递 ${src} → ${target}`);
}

const hashes = [];
for (const target of targets) {
  try {
    const meta = JSON.parse(await readFile(join(target, "artifact_meta.json"), "utf8"));
    hashes.push({ target, content_hash: meta.content_hash, artifact_version: meta.artifact_version });
  } catch {
    console.error(`缺少 artifact_meta.json：${target}`);
    process.exit(1);
  }
}

const unique = new Set(hashes.map((item) => item.content_hash));
if (unique.size !== 1) {
  console.error("产物哈希不一致：", hashes);
  process.exit(1);
}

console.log(`投递一致：content_hash=${hashes[0].content_hash.slice(0, 12)}…（${targets.length} 个宿主）`);