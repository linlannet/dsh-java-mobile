#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

const root = process.argv[2] ?? "..";
let failed = 0;

const sha256 = async (path) => {
  const buf = await readFile(path);
  return createHash("sha256").update(buf).digest("hex");
};

const metaHash = async (path) => {
  const meta = JSON.parse(await readFile(path, "utf8"));
  return meta.content_hash;
};

async function compare(label, leftPath, rightPath, readHash) {
  try {
    const [left, right] = await Promise.all([readHash(leftPath), readHash(rightPath)]);
    if (left === right) {
      console.log(`PASS  ${label}: ${left.slice(0, 12)}…`);
    } else {
      failed += 1;
      console.error(`FAIL  ${label}: ${left.slice(0, 12)}… != ${right.slice(0, 12)}…`);
    }
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${label}: ${error instanceof Error ? error.message : error}`);
  }
}

console.log(`一致性校验根目录：${root}\n`);

await compare(
  "H5 产物（h5-dist vs harmony rawfile）",
  join(root, "dsh-java-mobile/h5-dist/artifact_meta.json"),
  join(root, "dsh-java-mobile/harmony/entry/src/main/resources/rawfile/h5/artifact_meta.json"),
  metaHash,
);

await compare(
  "主工程 exec JAR vs desktop 内嵌",
  join(root, "dsh-java/dsh-java-app/target/dsh-java-app-0.2.2-exec.jar"),
  join(root, "dsh-java-desktop/resources/agent/dsh-java-app.jar"),
  sha256,
);

await compare(
  "主工程 exec JAR vs release dist",
  join(root, "dsh-java/dsh-java-app/target/dsh-java-app-0.2.2-exec.jar"),
  join(root, "dsh-java-release/dist/dsh-java-app.jar"),
  sha256,
);

await compare(
  "release 根 JAR vs release dist",
  join(root, "dsh-java-release/dsh-java-app.jar"),
  join(root, "dsh-java-release/dist/dsh-java-app.jar"),
  sha256,
);

if (failed > 0) {
  console.error(`\n一致性校验失败：${failed} 项`);
  process.exit(1);
}

console.log("\n一致性校验通过");