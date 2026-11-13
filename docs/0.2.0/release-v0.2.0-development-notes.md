# DSH Java Mobile v0.2.0 开发说明

> 版本：`v0.2.0` | 基线：`v0.1.0` | 主线：多端壳与"同一份 H5 产物"落地 | 架构：多端壳工程（Tauri 2 Mobile / ArkTS + ArkWeb / Taro 4） | 发布日期：2026-11-08

## 1. 版本概览

| 项目 | 内容 |
| --- | --- |
| 版本号 | 0.2.0 |
| 状态 | 已发布（骨架 + 产物流水线 + 契约 + 配对）；三端真机闭环随后续里程碑 |
| 基线 | v0.1.0 |
| H5 基线 | `dsh-java-desktop` 0.2.2 产物 |
| 壳形态 | Android/iOS：Tauri 2 Mobile（共享 Rust 壳）；HarmonyOS：ArkTS/ArkUI + ArkWeb；小程序：Taro 4 |
| 新增第三方依赖 | 无 |
| 新增 Maven 模块 | 无（本仓库无 Maven 工程） |
| 新增脚本 | 无（`scripts/` 维持 12 个） |
| 产物基线 | 18 文件、4,327,273 字节、`content_hash=cc78a10a2091b126198e32a2d1a7d381bde207cb8cd69e9467e42abdd3759f40` |
| 契约版本 / 最低桥版本 | `contractVersion=1` / `min_bridge_version=1` |
| 任务完成度 | 116 子任务：已完成 72、待办 44；本版本另增收口任务 8 条（待办） |

## 2. 版本亮点

### 2.1 同一份 H5 产物，四处消费

- 一次构建：`dsh-java-desktop` 构建 `dist`，由 `gen_artifact_meta.mjs` 生成内容哈希与契约版本。
- 两处内嵌：`distribute_h5.mjs` 投递到 `h5-dist/`（Android/iOS）与 `harmony/entry/src/main/resources/rawfile/h5/`（鸿蒙）。
- 一处复用：小程序以 Taro 壳复用协议 SDK 与模型，不新建第二套业务 UI。
- 一致性校验：`check_release_consistency.mjs` 校验跨宿主 `content_hash` 一致，实测两处均为 `cc78a10a…`。

### 2.2 平台适配层契约收敛

- 14 个能力域 / 29 个方法：`transport`、`credential`、`file`、`export_share`、`external_open`、`notify`、`clipboard`、`network`、`app_info`、`update`、`lifecycle`、`deeplink`、`git`、`diagnostics`、`storage`。
- 统一返回模型 `OK | UNSUPPORTED | DENIED | CANCELLED | FAILED`，默认超时 15s，取消与超时可区分。
- 业务层只依赖契约；移动端缺失能力以 `UNSUPPORTED` 降级，入口隐藏或置灰，不把异常抛给页面。

### 2.3 连接与设备配对

- 连接配置管理：新增/编辑/切换；`HTTPS` 强制 `https://`，`LOCAL` 强制回环；凭据只存引用。
- 六态连接状态机（未连接/连接中/已连接/重连中/鉴权失败/不可达），退避 1s → 15s 封顶，连续失败 3 次进入退避且可手动重试。
- 配对双路径：扫码 + 短码；配对码一次性、≤10 分钟、限流；设备凭据一次性签发、服务端仅存 SHA-256 摘要、可单设备吊销。
- 桌面端"允许移动设备连接"默认关闭，开启后强制鉴权。

### 2.4 HarmonyOS ArkWeb 壳

- `Index.ets` 以 `Web({ src: $rawfile("h5/index.html") })` 加载本地产物，加载失败显示错误态并可重新加载。
- `DshBridge.ets` 单命名空间 `dshBridge`、`bridge_version=1`、白名单 10 方法；未知方法返回 `UNSUPPORTED`。
- 权限最小化：仅 `ohos.permission.INTERNET`；`network_config.json` 默认 `cleartextTrafficPermitted=false`，仅回环放行。
- 深链：`module.json5` 声明 `dsh://connect`，直达连接页。
- **诚实边界**：白名单与协议形状已落地，但 `storage`/`clipboard`/`network`/`external`/`share`/`diagnostics` 当前仍为桩返回（`storage.get` 返回 `null`、`network.status` 固定在线等），真实系统能力实现见 `tasks.md` 6.6–6.10。

### 2.5 Android/iOS 共享壳

- 共享 Rust 壳 `src-tauri/`：`crate-type = ["staticlib","cdylib","rlib"]`，`#[cfg_attr(mobile, tauri::mobile_entry_point)]`。
- 仅注册 5 个官方插件：http、clipboard-manager、notification、deep-link、os；无自定义命令，因此不包含 Agent 生命周期与 Git 五件套。
- `capabilities/mobile.json` 限定 `android` / `iOS` 与最小权限集合；CSP `script-src 'self'`。
- 原生工程（`gen/android`、`gen/apple`）在 v0.2.0 尚未初始化，属后续里程碑。

### 2.6 窄屏与触控

- 360–430px 断点、移动单列 + 抽屉、安全区与键盘避让、44pt 触控目标、深色模式与系统字体缩放。
- 这些能力位于 `dsh-java-desktop` 的 H5 层，四端共用，不在本仓库重复实现。

### 2.7 工程回归与发布治理

- `desktop_regression.mjs` 11 项：桌面构建、单测、平台边界、产物元数据、绝对路径、体积、安全、离线、H5 冒烟、宿主投递、跨仓库一致性。
- 发布物料齐备：`release_checklist.md`、`store_compliance.md`、`security_acceptance.md`、`performance_acceptance.md`、`acceptance_evidence.md`、`known_limits.md`。
- 版本矩阵与能力裁剪矩阵作为单一事实源（`version_matrix.md`、`capability_matrix.md`）。

### 2.8 iOS 工具链落地准备（v0.2.0 后首个工程动作）

- 实测：完整 Xcode 已安装于 `/Applications/Xcode.app`，但 `xcode-select -p` 仍指向 `/Library/Developer/CommandLineTools`；`xcodebuild` 不可用；无 iOS 模拟器 runtime；无 CocoaPods；Rust 仅 `x86_64-apple-darwin`。
- 配置步骤已沉淀为 `docs/0.2.0/XCode.md`：启用 Xcode → 安装 runtime → Rust iOS target → CocoaPods → `npm install` → `npm run ios:init` → 模拟器/真机运行。
- 工程配置目标：最低 iOS 15.0、Bundle ID `net.linlan.dsh`、ATS 仅 `NSAllowsLocalNetworking`、`NSLocalNetworkUsageDescription`、`dsh://` scheme、Keychain 凭据。

## 3. 任务映射（spec §5 九大能力 → 实现）

| spec 能力 | 实现落位 |
| --- | --- |
| §5.1 多端形态与共享边界 | `h5-dist/`、`rawfile/h5/`、`harmony/`、`miniapp/`、`scripts/distribute_h5.mjs` |
| §5.2 H5 产物流水线 | `scripts/{gen_artifact_meta,check_h5_artifact,check_h5_size,check_h5_security,h5_offline_check,check_release_consistency}.mjs` |
| §5.3 平台适配层与桥协议 | `src-tauri/capabilities/mobile.json`、`harmony/.../bridge/DshBridge.ets`、desktop `src/platform/contract.ts` |
| §5.4 连接与设备配对 | desktop `src/platform/connection.ts`、`src/lib/agent-client.ts`；后端配对/吊销接口 |
| §5.5 窄屏与触控 | `../dsh-java-desktop` H5 样式层 |
| §5.6 HarmonyOS 壳 | `harmony/{AppScope,entry}/**`、`Index.ets`、`EntryAbility.ets` |
| §5.7 Android/iOS 壳 | `src-tauri/{Cargo.toml,src/lib.rs,tauri.conf.json,capabilities/mobile.json}` |
| §5.8 小程序 | `miniapp/`（Taro 4、`src/sdk/*`、`pages/index`） |
| §5.9 版本发布与工程治理 | `scripts/desktop_regression.mjs`、`docs/specs/mobile_app_evolution/*`、`CHANGELOG.md` |

## 4. 验证结论

- 产物门禁：元数据、绝对路径、体积、安全、离线、跨宿主一致性六项脚本齐备；实测两宿主 `content_hash` 一致。
- 回归：`desktop_regression.mjs` 定义 11 项，任一失败即中断并输出 PASS/FAIL 汇总。
- 架构边界：壳层无自定义命令；无 Agent/Git 命令；H5 产物无远程脚本与热更新入口。
- 验收证据：机器可验证项 H-02/H-16/H-17/H-18/H-19/H-20 为 PASS；真机项 H-01/H-03–H-15 为 BLOCKED（缺 Android SDK / Xcode / DevEco）。
- 文档一致性：四件套与 `mobile_app_evolution/tasks.md` 的 72/44 统计可复核；总任务 116、本版本另增 8 条收口任务。
- **未完成验证**：三端构建、真机闭环、性能与包体实测均未执行，不得标记 PASS。

## 5. 已知限制

1. **版本漂移（待收口）**：`CHANGELOG.md` 0.2.0 条目声明"移动壳版本已统一至 `package.json`（0.2.0）与 `src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`"，但实测 `Cargo.toml=0.1.0`、`tauri.conf.json=0.1.0`、`miniapp/package.json=0.1.0`、`artifact_meta.json` 的 `artifact_version=0.1.0`、`version_matrix.md=0.1.0`。收口任务见 `tasks.md` 第 13 组。
2. **鸿蒙桥为骨架**：白名单与协议正确，系统能力多为桩返回；`app.version` 硬编码 `0.1.0`、`diagnostics.export` 的 `artifactHash` 为空。
3. **原生工程未初始化**：`src-tauri/gen/` 不存在，Android/iOS 无法构建；`tauri ios init` / `tauri android init` 均未执行。
4. **iOS 工具链未就绪**：Xcode 未启用、无模拟器 runtime、无 CocoaPods、无 Rust iOS target、无签名 Team。
5. **Android 工具链未就绪**：无 Android SDK/NDK、无签名 keystore、无商店账号。
6. **鸿蒙真机未验证**：DevEco 与鸿蒙真机环境缺失，六项可行性实测未执行。
7. **小程序凭证缺失**：无微信 AppID/AppSecret，登录链路无法端到端验证；域名白名单与订阅消息未配置。
8. **移动端不内嵌 Agent**：不打包 JRE/JAR；`git` 能力为 `NONE`；更新仅提示跳商店。
9. **明文限制**：公网必须 HTTPS；仅回环与显式确认的局域网允许明文。
10. **依赖环境缺失**：本机 `node_modules` 未安装，`@tauri-apps/cli` 未就绪。

## 6. 依赖与体积增量

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| `@tauri-apps/cli` | `>=2.9.5 <3.0.0` | 唯一 devDependency，用于移动端初始化与构建 |
| Tauri 插件 | 2.x | `tauri-plugin-http`、`clipboard-manager`、`notification`、`deep-link`、`os` |
| Taro | 4.0.9 | 小程序壳（`miniapp/package.json`） |
| React | ^18.3.1 | 小程序壳渲染层 |

- 新增第三方依赖：**无**（相对 0.1.0）。
- 产物体积：未压缩 4,327,273 字节；首屏 gzip 约 364 KB（限额 1 MB）；完整 gzip 约 1.35 MB（限额 4 MB）。具体以 `check_h5_size.mjs` 实时输出为准。
- 安装包体积：Android/iOS/HAP 均未构建，无实测值。

## 7. 升级提示

1. **桌面端先升级**：移动端能力依赖 `dsh-java-desktop` 0.2.2 产物与 `dsh-java` 0.2.2 服务端；先升级桌面端与 Agent，再升级移动壳。
2. **契约兼容**：`contractVersion=1` 保持不变；旧壳加载新产物会提示"请升级应用"，新壳加载旧产物功能可用。
3. **产物不可手改**：升级时执行 `npm run deploy:h5` 重新投递，并以 `npm run consistency` 校验哈希；禁止手工替换 `h5-dist` 或修改 `artifact_meta.json`。
4. **配对与凭据**：升级不清空连接配置；若服务端轮换密钥，需在移动端刷新或重新配对。
5. **已知问题**：版本漂移与鸿蒙桥桩实现见 §5，升级后请以 `tasks.md` 第 13 组收口结果为准。

> 关联文档：需求 `spec.md`、实现 `design.md`、任务 `tasks.md`、iOS 工具链 `XCode.md`；完整任务与证据见 `docs/specs/mobile_app_evolution/`。