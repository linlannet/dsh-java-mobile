# 附录 F 验收证据归档（H-01–H-20）

> 证据口径：`PASS` 需附命令或文件；真机项填执行环境、设备型号与截图路径。禁止无证据标记 PASS。

## 机器可验证项（本机已通过）

| 编号 | 检查项 | 状态 | 证据 |
| --- | --- | --- | --- |
| H-02 | 三端加载同一份 H5 产物 | PASS | `node scripts/check_release_consistency.mjs ..` → H5 产物哈希一致 |
| H-16 | 明文阻断 / 局域网确认 | PASS | `connection.test.ts`（公网 http 阻断、局域网需显式确认） |
| H-17 | 白屏 / 崩溃恢复 | PASS | `Index.ets` 错误态 + 重新加载；H5 侧 `ErrorBoundary` |
| H-18 | 诊断导出脱敏 | PASS | `diagnostics.test.ts`（Bearer/sk/password/X-API-Key） |
| H-19 | 包体与首屏体积门禁 | PASS | `node scripts/check_h5_size.mjs`（首屏 ≤1MB、完整 ≤4MB gzip） |
| H-20 | 无远程脚本 / 热更新 | PASS | `node scripts/check_h5_security.mjs`、`h5_offline_check.mjs` |

## 真机项（待 Android SDK / Xcode / DevEco）

| 编号 | 检查项 | 状态 | 执行环境（待填） | 证据（待填） |
| --- | --- | --- | --- | --- |
| H-01 | 安装启动不白屏 | BLOCKED | Android 13 / iOS 17 / HarmonyOS 5 | 启动截图 |
| H-03 | 连接页地址与健康检查 | BLOCKED | — | 录屏 / 截图 |
| H-04 | 设备配对（短码）成功 | BLOCKED | — | 配对码 + 设备列表截图 |
| H-05 | 配对码过期 / 已使用提示 | BLOCKED | — | 错误提示截图 |
| H-06 | 会话列表与对话闭环 | BLOCKED | — | 对话截图 |
| H-07 | 流式输出与中断对账 | BLOCKED | — | 断网重连录屏 |
| H-08 | 审批 / 问答可操作 | BLOCKED | — | 审批截图 |
| H-09 | 安全存储、吊销后 401 | BLOCKED | — | 吊销前后请求日志 |
| H-10 | 文件选择 / 导出 / 分享 | BLOCKED | — | 操作录屏 |
| H-11 | 通知授权与拒绝降级 | BLOCKED | — | 授权弹窗截图 |
| H-12 | 剪贴板读写 | BLOCKED | — | 截图 |
| H-13 | 网络状态变化 | BLOCKED | — | 日志 |
| H-14 | 深链打开连接页 | BLOCKED | — | `dsh://connect` 截图 |
| H-15 | 前后台切换与后台流式 | BLOCKED | — | 录屏 |

## 回归命令

```bash
cd dsh-java-mobile
node scripts/desktop_regression.mjs ../dsh-java-desktop .
```

输出包含：桌面构建、单测、平台边界、产物元数据、绝对路径、体积、安全、离线、H5 冒烟、宿主投递、跨仓库一致性 11 项。

## 归档要求

1. 每项截图命名：`H-xx_<平台>_<场景>.png`，存 `docs/evidence/<版本>/`。
2. 真机项需记录：设备型号、系统版本、壳版本、产物哈希。
3. 未通过项必须写明失败现象与复现步骤，不得留空。