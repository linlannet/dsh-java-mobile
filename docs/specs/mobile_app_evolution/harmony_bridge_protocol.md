# 鸿蒙 JSBridge 协议

## 命名空间与版本

- 注入对象：`window.dshBridge`（单一命名空间）
- 协议版本：`1`（`getVersion()` 返回）
- 方法白名单：`invoke`、`getVersion`

## 请求/响应

请求（JSON 字符串）：

```json
{ "id": "1699999999-ab12", "method": "storage.get", "args": "{\"key\":\"dsh-theme\"}" }
```

响应（JSON 字符串）：

```json
{ "id": "1699999999-ab12", "ok": true, "data": "{\"value\":\"dark\"}", "code": "" }
```

失败：

```json
{ "id": "1699999999-ab12", "ok": false, "data": null, "code": "UNSUPPORTED" }
```

## 方法白名单

| method | args | data |
| --- | --- | --- |
| app.version | `{}` | `{ version, bridgeVersion }` |
| storage.get | `{ key }` | `{ value }` |
| storage.set | `{ key, value }` | `{ ok }` |
| storage.remove | `{ key }` | `{ ok }` |
| clipboard.write | `{ text }` | `{ ok }` |
| clipboard.read | `{}` | `{ value }` |
| network.status | `{}` | `{ online, type }` |
| external.openUrl | `{ url }` | `{ ok }` |
| share.open | `{ text, url, filePath }` | `{ ok }` |

## 约束

1. 未知方法返回 `UNSUPPORTED`，不抛异常到 H5。
2. 请求超时由 H5 侧控制（默认 15s），超时抛 `BRIDGE_TIMEOUT`。
3. 桥不返回明文密钥；凭据仅返回引用。
4. 所有参数/返回值均为 JSON 字符串，避免 ArkTS 与 JS 类型互操作问题。
5. 新增方法必须同步更新 `DshBridge.ets` 白名单与本文档。