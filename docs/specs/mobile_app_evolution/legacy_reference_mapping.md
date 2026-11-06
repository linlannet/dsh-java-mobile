# legacy 参考映射与冻结边界

> 2026-11-04 经用户确认，`legacy/kmp/` 已**物理删除**，不再参与构建。
> 本文档记录原 KMP/Kuikly 资产与新实现的对应关系，便于追溯，不代表代码仍存在。

## 删除事实

- 原目录：`shared`、`androidApp`、`iosApp`、`ohosApp`、`buildSrc`、Gradle 体系、`package.json`、`.github`、`.run`、`keystore`
- 处置：整体删除（不归档）；`docs/specs/` 与需求/设计文档保留

## 能力映射

| 原 KMP 资产 | 原用途 | 新实现位置 |
| --- | --- | --- |
| `shared/src/sseMain` | Ktor SSE/WS 协议 | `dsh-java-desktop/src/lib/agent-client.ts` + `src/platform/transport.ts` |
| `shared/src/commonMain`（Kuikly 页面） | 移动 UI | `dsh-java-desktop/src/components/*`（同一份 React H5） |
| `shared/commonTest/DshContractTest` | 契约测试 | `dsh-java-desktop/tests/unit/contract.test.ts`（五端参数化） |
| `androidApp` SSH 隧道 | SSH 端口转发 | 计划：Tauri 插件（9.1） |
| `androidApp` Relay | 扫码中继 | 计划：Relay 客户端（9.3，待决策） |
| `androidApp` 扫码 | 配对扫码 | 计划：Tauri 扫码插件（9.4） |
| `androidApp` 安全存储 | Keystore | 已实现：`src/platform/credential.ts`（Tauri 端） |
| `iosApp` Keychain | 凭据存储 | 已实现：同上（Tauri iOS 端） |
| `ohosApp` EntryAbility | 鸿蒙入口 | 已实现：`harmony/entry/src/main/ets/entryability/EntryAbility.ets` |
| `ohosApp` Kuikly 桥 | 原生桥 | 已实现：`harmony/entry/src/main/ets/bridge/DshBridge.ets` |

## 冻结边界

- 不再新增任何 KMP/Kuikly 代码。
- 若需恢复参考实现，从对应仓库历史提交（`git log`）检索，不新建 `legacy/` 目录。
- 新能力一律通过 `src/platform/contract.ts` 的能力域扩展，不新增第二套协议或 UI 栈。