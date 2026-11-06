#!/usr/bin/env node
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const desktop = resolve(process.argv[2] ?? "../dsh-java-desktop");
const mobile = resolve(process.argv[3] ?? ".");

const steps = [
  { name: "桌面构建（含 tsc）", cwd: desktop, cmd: "npm run build" },
  { name: "桌面单元/契约测试", cwd: desktop, cmd: "npm test" },
  { name: "平台边界检查", cwd: desktop, cmd: "npm run check:boundary" },
  { name: "生成产物元数据", cwd: mobile, cmd: "node scripts/gen_artifact_meta.mjs ../dsh-java-desktop/dist" },
  { name: "产物绝对路径检查", cwd: mobile, cmd: "node scripts/check_h5_artifact.mjs ../dsh-java-desktop/dist" },
  { name: "产物体积门禁", cwd: mobile, cmd: "node scripts/check_h5_size.mjs ../dsh-java-desktop/dist" },
  { name: "产物安全扫描", cwd: mobile, cmd: "node scripts/check_h5_security.mjs ../dsh-java-desktop/dist" },
  { name: "离线/CDN 校验", cwd: mobile, cmd: "node scripts/h5_offline_check.mjs ../dsh-java-desktop/dist" },
  { name: "H5 静态闭环", cwd: desktop, cmd: "node scripts/h5_smoke.mjs dist" },
  { name: "投递到各宿主", cwd: mobile, cmd: "node scripts/distribute_h5.mjs ../dsh-java-desktop/dist" },
  { name: "跨仓库一致性校验", cwd: mobile, cmd: "node scripts/check_release_consistency.mjs .." },
];

const results = [];

for (const step of steps) {
  process.stdout.write(`\n▶ ${step.name}\n`);
  try {
    execSync(step.cmd, { cwd: step.cwd, stdio: "inherit" });
    results.push({ name: step.name, ok: true });
  } catch {
    results.push({ name: step.name, ok: false });
    console.error(`\n✗ 失败：${step.name}（${step.cmd}）`);
    break;
  }
}

console.log("\n===== 桌面端回归汇总 =====");
for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.name}`);
}

const failed = results.filter((result) => !result.ok).length;
if (failed) {
  console.error(`\n回归失败：${failed} 项`);
  process.exit(1);
}
console.log("\n桌面端回归全部通过");