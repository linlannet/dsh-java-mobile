# DSH Java Mobile

DSH 多端**壳工程**：Android / iOS / HarmonyOS / 微信小程序共用**同一份 React H5 产物**。

> UI 唯一事实源在 `../dsh-java-desktop`。本仓库**不承载 React 业务源码**，只承载壳层、原生能力桥、构建脚本与产物消费。
> 需求与任务规格见 `docs/specs/mobile_app_evolution/`。

## 平台路径

| 平台 | 壳层 | 产物 |
| --- | --- | --- |
| Android | Tauri 2 Mobile（Rust + Kotlin 插件） | APK / AAB，内嵌 `h5-dist` |
| iOS | Tauri 2 Mobile（Rust + Swift 插件） | IPA，内嵌 `h5-dist` |
| HarmonyOS | ArkTS/ArkUI + ArkWeb `Web`（方案 ①） | HAP，内嵌 `rawfile/h5` |
| 微信小程序 | Taro 4 + React（复用协议 SDK，不新建 UI） | 小程序包，`miniapp/dist` |

## 目录

```text
dsh-java-mobile/
├── docs/specs/           需求、任务、验收、清理记录
├── h5-dist/              H5 产物注入目录（CI 下载，不入库）
├── scripts/              产物检查、分发、元数据、回归、一致性校验
├── src-tauri/            Android/iOS 共享 Rust 壳（Tauri 2）
├── harmony/              HarmonyOS ArkTS 壳（ArkWeb）
└── miniapp/              微信小程序（Taro 4 + React）
```

## 构建顺序

1. 在 `../dsh-java-desktop` 执行 `npm run build`（唯一一次前端构建）。
2. `node scripts/distribute_h5.mjs ../dsh-java-desktop/dist` 投递到 `h5-dist/` 与鸿蒙 `rawfile/h5/`。
3. Android：`npm run android:build`（首次 `npm run android:init`）。
4. iOS：`npm run ios:build`（首次 `npm run ios:init`）。
5. HarmonyOS：DevEco / `hvigorw assembleHap`。
6. 小程序：`cd miniapp && npm install && npm run build:weapp`。

## 一键回归

```bash
node scripts/desktop_regression.mjs ../dsh-java-desktop .
```

依次执行：桌面构建、单测、平台边界、产物元数据、绝对路径、体积、安全、离线、H5 冒烟、宿主投递、跨仓库一致性；任一步失败即中断。

## 脚本清单

| 脚本 | 用途 |
| --- | --- |
| `gen_artifact_meta.mjs` | 生成 `artifact_meta.json`（content_hash、commit、时间、契约版本） |
| `check_h5_artifact.mjs` | 禁止绝对路径、`file://`、本地用户路径、sourcemap 残留 |
| `check_h5_size.mjs` | 体积门禁（首屏 ≤1MB、完整 ≤4MB，gzip） |
| `check_h5_security.mjs` | 阻断远程脚本/动态 import/热更新；第三方 `new Function` 告警 |
| `h5_offline_check.mjs` | HTML/CSS 无外部 CDN 依赖 |
| `distribute_h5.mjs` | 一次构建、多宿主投递并校验哈希 |
| `verify_hosted_hash.mjs` | 内嵌与同源托管产物全量哈希比对 |
| `gen_manifest_doc.mjs` | 生成 `artifact_manifest.md` 产物清单 |
| `check_release_consistency.mjs` | H5 产物 + desktop 内嵌 JAR + release dist 哈希一致 |
| `verify_artifact_consistency.mjs` | 解包 APK/AAB/IPA/HAP 比对 `artifact_meta.json` |
| `desktop_regression.mjs` | 桌面端全链路回归（11 项） |

## 当前状态

- 已完成：H5 单一产物、传输/连接抽象、设备配对（短码）与移动访问开关、三端壳骨架、小程序骨架、产物流水线、桌面端一键回归。
- 剩余阻塞：Android SDK（5.x）、完整 Xcode（7.x）、DevEco + 鸿蒙真机（6.x）、9.x 选型（SSH/Relay/扫码）、微信 appid/secret（12.2）、三端构建跑通后的 CI/验收（10.5–10.7、11.x）。

## 约束

- 禁止在本仓库新建第二个 React 入口工程，禁止 fork UI。
- 壳层不得承载业务规则；业务只经平台适配层与 H5 交互。
- 旧 KMP/Kuikly 资产已清理，不再参与构建。