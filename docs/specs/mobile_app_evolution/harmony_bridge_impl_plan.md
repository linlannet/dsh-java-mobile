# 鸿蒙桥实现计划（6.6–6.10，待 DevEco 环境落地）

> 当前 `DshBridge.ets` 已落地 6.5/6.12/6.13/6.14；以下方法需在具备 DevEco Studio 的环境实现并编译验证。H5 侧调用已在 `harmony_bridge.ts` 就绪，新增方法只需扩白名单。

## 6.6 安全存储桥

| 方法 | ArkTS API | 说明 |
| --- | --- | --- |
| `secure.set(ref, secret)` | `preferences.getPreferences(ctx, "dsh_secure")` + `put/flush` | 只存凭据引用与加密值 |
| `secure.delete(ref)` | `preferences.delete` + `flush` | 吊销后清理 |
| `secure.exists(ref)` | `preferences.has` | 返回布尔 |

约束：不以明文返回密钥；H5 仅获取引用状态。异步方法走 `asyncMethodList`，H5 侧 `harmony_call` 已支持 Promise。

## 6.7 文件选择桥

| 方法 | ArkTS API | 说明 |
| --- | --- | --- |
| `file.pick` | `picker.DocumentViewPicker` | 返回 uri + name + size |
| `file.readText` / `file.readBinary` | `fileIo` | 读 rawfile/uri |
| `file.stat` / `file.listDir` | `fileIo.stat` / `listFile` | 目录与元信息 |

权限：仅用户选择后访问，不申请全盘权限。

## 6.8 导出与系统分享桥

| 方法 | ArkTS API | 说明 |
| --- | --- | --- |
| `share.open` | `systemShare`（`@kit.ArkUI`） | 文本/链接/文件分享 |
| `file.export` | `DocumentViewPicker.save` + `fileIo.copy` | 导出到用户选择位置 |

失败降级：复制链接到剪贴板并提示。

## 6.9 通知、剪贴板、网络、外部打开

| 方法 | ArkTS API | 说明 |
| --- | --- | --- |
| `notify.send` | `notificationManager.publish` | 需用户授权通知 |
| `notify.permission` | `notificationManager.requestEnableNotification` | 返回授权状态 |
| `clipboard.write/read` | `pasteboard.getSystemPasteboard()` | 文本读写 |
| `network.status` | `connection.getDefaultNetSync` | 在线状态与类型 |
| `network.onChange` | `connection.on('netAvailable'/'netLost')` | 订阅/取消 |
| `external.openUrl` | `want` + `startAbility` | 浏览器打开 |

## 6.10 生命周期与后台策略

| 能力 | 实现 |
| --- | --- |
| 前后台 | `UIAbility.onForeground/onBackground` 通过回调转 Web（`webviewController.runJavaScript`） |
| 后台流式 | 进入后台后暂停 SSE 读取，回前台按 `afterSeq` 对账 |
| 低内存 | `onMemoryLevel` 触发 Web 缓存清理与重载 |

## 验收前置

1. DevEco Studio + HarmonyOS SDK + 签名证书。
2. 真机六项实测（POST SSE、上传、Blob 下载、rawfile scheme、DOM 存储、混合内容）。
3. 桥方法白名单与 `harmony_bridge_protocol.md` 同步。