# dsh-java-mobile 存量资产清理记录

> 日期：2026-11-04
> 依据：`docs/specs/mobile_app_evolution/spec.md` 附录 E（存量资产处置矩阵）
> 决策：Android/iOS 采用 Tauri 2 Mobile；HarmonyOS 采用 ArkTS/ArkUI + ArkWeb 壳（方案 1）；三端共享同一份 React H5 产物。

## 1. 清理原则

- **源码不物理删除，统一归档**：当前仓库 git 仅跟踪 `.gitignore`、`LICENSE`、`README.md` 三个文件，KMP/Kuikly 源码均未纳入版本控制，物理删除不可恢复，故整体移至 `legacy/kmp/` 冻结保存。
- **仅删除可再生构建产物**：`build/`、`.gradle/`、`.kotlin/`、`kotlin-js-store/` 及模块 `build/`。
- **保留可复用能力资产**：SSH 隧道、Relay、安全存储、扫码等实现随源码归档，作为 Tauri 插件/ArkTS 桥的重写参考。

## 2. 归档清单（`legacy/kmp/`）

| 资产 | 说明 |
|---|---|
| `shared/` | KMP 共享层（commonMain 含 Kuikly 页面；sseMain 为 Ktor 协议实现；androidMain/iosMain/jsMain/ohosMain/commonTest） |
| `androidApp/` | Android 宿主（Kuikly 渲染、SSH、Relay、扫码、安全存储） |
| `iosApp/` | iOS 宿主（Swift/ObjC 的 Keychain、SSH、Relay、扫码） |
| `ohosApp/` | OpenHarmony 宿主（EntryAbility、Kuikly 入口、`kuikly/native` 桥） |
| `buildSrc/` | Gradle 版本与构建插件常量 |
| `gradle/`、`gradlew`、`gradlew.bat`、`*.gradle.kts`、`gradle.properties` | KMP/Kuikly 构建体系 |
| `package.json` | 原 static_server 脚本与依赖 |
| `.github/` | 原 CI（release / contract-test），待按新路径重建 |
| `.run/` | OpenHarmony 运行配置 |
| `keystore/` | 原签名材料（保留，供迁移参考） |

## 3. 已删除（可再生）

`build/`、`.gradle/`、`.kotlin/`、`kotlin-js-store/`、各模块 `build/`。

## 4. 保留在工程根

`docs/`、`LICENSE`、`README.md`、`.gitignore`、`.git/`。

## 5. 处置对照（按 spec 附录 E）

| 资产 | 处置 | 现状 |
|---|---|---|
| Kuikly 页面栈 | 冻结 | 归档于 `legacy/kmp/shared/src/commonMain` |
| KMP 协议层（Ktor SSE/WS） | 冻结（参考） | 归档于 `legacy/kmp/shared/src/sseMain` |
| SSH/Relay/安全存储/扫码 | 保留能力、重写接口 | 归档为参考实现 |
| androidApp / iosApp 壳 | 替换 + 冻结 | 归档；壳由 Tauri 2 Mobile 重建 |
| ohosApp 壳 | 改造 | 归档；入口改 ArkWeb，保留 native 桥参考 |
| h5App / miniApp 声明 | 移除 | 随 `settings.gradle.kts` 归档 |

## 6. 后续

- 2026-11-04 经用户确认"用不到，就删掉"，`legacy/kmp/` 已**物理删除**；工程仅保留 `docs/`、`LICENSE`、`README.md`、`.gitignore`、`.git/`。
- `README.md` 仍为 KMP 说明，待按新架构重写（列入开发任务）。
- `.gitignore` 需按 React/Tauri 工程重建（列入开发任务）。