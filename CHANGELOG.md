# 更新日志（Changelog）

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 约定。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

> **本仓库是多端壳工程**：Android/iOS（Tauri 2 Mobile）、HarmonyOS（ArkTS/ArkUI + ArkWeb）、微信小程序（Taro）共用同一份来自 `dsh-java-desktop` 的 React H5 产物。**本仓库不承载 React 业务源码**，只承载壳层、原生桥、构建脚本与产物消费；UI 事实源见 `../dsh-java-desktop`。移动端不内嵌 JRE/JAR，通过连接既有 Agent 承载点（桌面端托管 / 局域网自建 / 云侧 HTTPS）使用智能体能力。

## [0.2.0] - 2026-11-08

### 新增
- 能力对齐 dsh-java 0.2.2 基线：内嵌 H5 产物随 desktop 0.2.2 同步；连接 dsh-java 0.2.2 服务端后可使用其新增后端能力（飞书机器人、配对码/设备凭据等）。
- 多端版本矩阵与能力裁剪矩阵（`docs/specs/mobile_app_evolution/version_matrix.md`、`capability_matrix.md`）作为单一事实源，覆盖 desktop / Android / iOS / HarmonyOS / 小程序 × 14 能力域的 `FULL/DEGRADED/NONE` 状态。

### 变更
- 版本声明对齐：移动壳版本统一至 `package.json`（`0.2.0`）与 `src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 的壳版本；H5 产物内容哈希、契约版本（`contractVersion=1`）与 dsh-java 0.2.2 对齐。
- 内嵌产物同步：由 `distribute_h5.mjs` 将 desktop 构建产物投递至 `h5-dist/`（Android/iOS 内嵌）与 `harmony/.../rawfile/h5/`（鸿蒙内嵌）；`artifact_meta.json` 记录内容哈希、提交号与契约版本，跨宿主哈希一致性由 `check_release_consistency.mjs` 校验。

## [0.1.0] - 2026-11-06（初版）

首个公开发布版本：多端壳骨架 + 单一 H5 产物流水线（壳层为骨架，三端真机闭环随后续里程碑补全）。

### 壳层
- Android/iOS：建立 Tauri 2 Mobile 共享 Rust 壳（`src-tauri/`），仅保留移动可复用命令（文件、凭据、通知、外部打开、分享、版本、生命周期、深链、诊断），**不注册** `start_agent`/`stop_agent`/`agent_status` 与 Git 五件套；不内嵌 JRE/JAR，包体仅含 WebView 资源。
- HarmonyOS：建立 ArkTS/ArkUI + ArkWeb `Web` 容器骨架，`entry/src/main/ets/pages/Index.ets` 加载 `rawfile/h5/`，`bridge/DshBridge.ets` 注入版本化白名单桥（`bridge_version=1`，未知方法/版本拒绝并审计）。
- 微信小程序：Taro 4 + React 骨架，复用协议 SDK 与模型，不新建第二套业务 UI 栈。

### 同一份 H5 产物
- 一次构建、四处消费：`dsh-java-desktop` 构建一次，由 `distribute_h5.mjs` 投递到 `h5-dist/`（Android/iOS 内嵌）与 `harmony/.../rawfile/h5/`（鸿蒙内嵌）。
- 产物质量门禁：`gen_artifact_meta.mjs`（内容哈希/契约版本）、`check_h5_artifact.mjs`（禁止绝对路径/`file://`/sourcemap 残留）、`check_h5_size.mjs`（首屏 ≤1MB、完整 ≤4MB gzip）、`check_h5_security.mjs`（禁止远程脚本/`eval`/热更新）、`h5_offline_check.mjs`（无 CDN 依赖、可离线冷启动）。

### 平台适配与连接
- 平台适配层契约：14 能力域 / 29 方法（`transport`/`credential`/`file`/`export_share`/`external_open`/`notify`/`clipboard`/`network`/`app_info`/`lifecycle`/`deeplink`/`diagnostics`/`storage` 等），业务层只依赖契约，各端实现可降级（如 `git` 在移动端返回 `UNSUPPORTED`）。
- 连接与设备配对：连接配置管理（新增/编辑/切换/隔离会话缓存）、六态连接状态机（未连接/连接中/已连接/重连中/鉴权失败/不可达）与退避重连；服务端配对码/二维码 + 设备凭据（Keystore/Keychain/系统安全存储），桌面端「允许移动设备连接」开关（默认关闭、开启后强制鉴权）。
- 窄屏与触控：360–430px 断点、移动单列 + 抽屉、安全区与键盘避让、44pt 触控目标、深色模式与系统字体缩放。
- 公网 HTTPS 校验与明文阻断：公网地址必须 `https://`，回环/局域网明文需用户显式确认，容器混合内容拦截给出可执行提示而非笼统「网络错误」。

### 工程与回归
- `desktop_regression.mjs` 一键回归：前端构建、单测、平台边界、产物元数据、体积、安全、离线、H5 冒烟、宿主投递、跨仓库哈希一致性；任一步失败即中断。
- legacy KMP/Kuikly 资产冻结为参考，不再进入构建；仓库边界（UI 只在 desktop，壳只在 mobile）由 `check_platform_boundary.mjs` 守门。
