# 发布检查单、灰度与回滚

## 发布前检查（全部通过才可发布）

| 检查项 | 命令/证据 | 通过标准 |
| --- | --- | --- |
| 前端构建唯一 | `dsh-java-desktop: npm run build` | 一次构建，产物唯一 |
| 产物元数据 | `node scripts/gen_artifact_meta.mjs dist` | `artifact_meta.json` 生成 |
| 产物检查 | `node scripts/check_h5_artifact.mjs` | 无绝对路径/file:// |
| 体积门禁 | `node scripts/check_h5_size.mjs` | 首屏 ≤1MB(gzip)、完整 ≤4MB(gzip) |
| 安全扫描 | `node scripts/check_h5_security.mjs` | 阻断规则 0 命中 |
| 离线校验 | `node scripts/h5_offline_check.mjs` | 无外部 CDN |
| 投递一致 | `node scripts/distribute_h5.mjs` | 各宿主 `content_hash` 一致 |
| 契约回归 | `DSH_CONTRACT_REQUIRED=1 npm test` | 五端用例通过 |
| 平台边界 | `npm run check:boundary` | 0 违规 |
| 三端构建 | Android AAB / iOS IPA / HAP | 构建成功、签名有效 |
| 真机闭环 | 各端自测报告 | 附录 F 预验收通过 |

## 灰度策略

1. 桌面端先发（0.2.x），保留旧版兼容窗口。
2. Android 先 5% 灰度，观察崩溃率与连接失败率，24h 无异常再放量。
3. iOS 走 TestFlight 分批。
4. 鸿蒙按 AGC 灰度比例发布。
5. 小程序按微信灰度发布。

## 回滚

- H5 产物：保留上一版 `artifact_meta.json` 与文件集，壳可回退加载。
- Android：商店回滚到上一版本号。
- iOS：TestFlight 回退构建。
- 鸿蒙：AGC 回滚。
- 服务端仅新增接口，不做破坏性变更；`/api/devices/*` 保持向后兼容。

## 发布后观测

- 崩溃率、连接成功率、配对成功率、流式首字节时延、对账触发次数。
- 异常上报包含：宿主、壳版本、产物哈希、桥版本、错误码。