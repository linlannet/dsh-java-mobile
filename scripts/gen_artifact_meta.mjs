#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const root = process.argv[2] ?? "../dsh-java-desktop/dist";
const artifact_version = process.argv[3] ?? "0.1.0";
const contract_version = Number(process.argv[4] ?? "1");
const min_bridge_version = Number(process.argv[5] ?? "1");

const skip = new Set(["artifact_meta.json", "artifact_manifest.json"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const files = [];
for (const file of await walk(root)) {
  const rel = relative(root, file).split("\\").join("/");
  if (skip.has(rel)) continue;
  const buf = await readFile(file);
  files.push({
    path: rel,
    bytes: buf.length,
    sha256: createHash("sha256").update(buf).digest("hex"),
  });
}

files.sort((a, b) => a.path.localeCompare(b.path));

const content_hash = createHash("sha256")
  .update(files.map((file) => `${file.path}:${file.sha256}`).join("\n"))
  .digest("hex");

let commit = process.env.GIT_COMMIT ?? "";
if (!commit) {
  try {
    commit = execSync(`git -C ${JSON.stringify(join(root, ".."))} rev-parse --short HEAD`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    commit = "unknown";
  }
}

const meta = {
  artifact_version,
  contract_version,
  min_bridge_version,
  built_at: new Date().toISOString(),
  commit,
  content_hash,
  total_bytes: files.reduce((sum, file) => sum + file.bytes, 0),
  files,
};

await writeFile(join(root, "artifact_meta.json"), JSON.stringify(meta, null, 2));
console.log(
  `artifact_meta.json 生成：hash=${content_hash.slice(0, 12)}… commit=${commit} files=${files.length} bytes=${meta.total_bytes}`,
);