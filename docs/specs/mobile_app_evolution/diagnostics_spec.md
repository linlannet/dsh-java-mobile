# 诊断与日志规范

## 诊断必备五项

| 项 | 来源 | 示例 |
| --- | --- | --- |
| 宿主 | `platform/capabilities.ts#detect_host` | `android` |
| 壳版本 | `app_info.version` | `0.1.0` |
| 产物哈希 | `artifact_meta.json.content_hash` | `5a9db0a5…` |
| 桥版本 | `platform/version.ts#BRIDGE_VERSION` | `1` |
| 内核版本 | 壳上报（Tauri WebView / ArkWeb） | `Chromium 120` |

## 脱敏字段

导出诊断前必须抹除：

- API Key / Bearer token
- 模型密钥
- SSH 私钥
- 完整配对码（保留前后各 2 位）
- 对话正文与工具调用参数中的敏感值

## 导出格式

```json
{
  "generated_at": "ISO-8601",
  "host": "android",
  "shell_version": "0.1.0",
  "artifact_hash": "…",
  "bridge_version": 1,
  "kernel": "…",
  "capabilities": { "transport": "AVAILABLE", "git": "UNAVAILABLE" },
  "errors": [{ "code": "NETWORK", "message": "网络不可达", "trace_id": "…" }]
}
```

## 错误码表

| code | 含义 | 可重试 |
| --- | --- | --- |
| AUTH | 凭据无效 | 否 |
| FORBIDDEN | 无权限 | 否 |
| NOT_FOUND | 资源不存在 | 否 |
| SERVER | 服务端错误 | 是 |
| TIMEOUT | 超时 | 是 |
| NETWORK | 网络不可达 | 是 |
| CONTRACT | 契约不符 | 否 |
| ABORTED | 用户取消 | 是 |
| UNSUPPORTED | 宿主不支持 | 否 |
| DENIED | 权限被拒 | 否 |
| CANCELLED | 用户取消能力调用 | 是 |

## 关键链路标识

连接、配对、流式对话、审批、文件操作五类链路各自使用独立 `trace_id` 前缀（`conn-` / `pair-` / `stream-` / `approval-` / `file-`），便于日志聚合定位。