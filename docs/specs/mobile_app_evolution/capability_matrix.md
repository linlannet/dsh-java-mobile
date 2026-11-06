# 能力矩阵（单一来源）

> 状态口径：FULL = 完整可用；DEGRADED = 降级可用；NONE = 不支持（入口隐藏或置灰）。
> 与 `spec.md` 附录 D 逐项对齐；新增能力必须同步更新本表。

| 能力域 | desktop | Android | iOS | HarmonyOS | 小程序 |
| --- | --- | --- | --- | --- | --- |
| transport | FULL | FULL | FULL | FULL | DEGRADED |
| credential | FULL | FULL | FULL | FULL | NONE |
| file | FULL | FULL | FULL | DEGRADED | NONE |
| export_share | FULL | FULL | FULL | FULL | DEGRADED |
| external_open | FULL | FULL | FULL | FULL | NONE |
| notify | FULL | FULL | FULL | FULL | NONE |
| clipboard | FULL | FULL | FULL | FULL | DEGRADED |
| network | FULL | FULL | FULL | FULL | FULL |
| app_info | FULL | FULL | FULL | FULL | FULL |
| update | FULL | DEGRADED | DEGRADED | NONE | NONE |
| lifecycle | FULL | FULL | FULL | FULL | DEGRADED |
| deeplink | FULL | FULL | FULL | FULL | DEGRADED |
| git | FULL | NONE | NONE | NONE | NONE |
| diagnostics | FULL | FULL | FULL | FULL | DEGRADED |
| storage | FULL | FULL | FULL | FULL | DEGRADED |

## 降级说明

- **小程序 transport DEGRADED**：仅 HTTPS，受平台域名白名单限制。
- **小程序 credential NONE**：不使用安全存储，凭据由用户每次输入或走设备绑定。
- **HarmonyOS file DEGRADED**：文件选择/导出经 ArkWeb 桥，超大文件受限。
- **Android/iOS update DEGRADED**：仅提示跳转应用商店，不做应用内静默更新。
- **git NONE（移动端）**：移动壳不注册 Git 命令，相关入口隐藏。
- **diagnostics DEGRADED（小程序）**：仅导出精简诊断，不含本地文件信息。

## 最低支持版本

| 能力域 | 最低桥版本 |
| --- | --- |
| transport | 1 |
| credential | 1 |
| file / export_share / external_open | 1 |
| notify / clipboard / network | 1 |
| app_info / update / lifecycle / deeplink | 1 |
| git / diagnostics / storage | 1 |