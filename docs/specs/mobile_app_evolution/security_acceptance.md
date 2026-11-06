# 安全验收记录

## 1. 凭据与密钥

- 前端不保存密钥明文：`ConnectionProfile.credential_ref` 仅存引用（`connection.ts` 校验规则）。
- Tauri 端凭据走 `credential` 能力层（`tauri_credential.ts`），浏览器端退化为内存（`memory_credential.ts`）。
- 后端设备 token 仅签发时返回一次，服务端只存 SHA-256 摘要（`DevicePairingUseCase#hash`）。
- 设备吊销后 `ApiKeyAuthInterceptor` 立即返回 401。

## 2. 诊断脱敏

`diagnostics.ts#redact` 覆盖：

- `Bearer <token>` → `Bearer ***`
- `sk-*` → `sk-***`
- `password|secret|token=*` → `***`
- `X-API-Key:*` → `***`

单测：`tests/unit/diagnostics.test.ts` 覆盖四类脱敏与错误信息导出。

## 3. 产物安全

- `check_h5_security.mjs`：阻断远程 `<script>`、远程动态 `import()`、热更新入口；第三方库 `new Function` 降级为警告（CSP 未启用 `unsafe-eval`）。
- `h5_offline_check.mjs`：HTML/CSS 无外部 CDN 依赖。
- Tauri CSP：`script-src 'self'`，无 `unsafe-eval`。

## 4. 传输与明文

- 公网地址强制 `https://`（`validate_connection`）。
- 局域网明文需显式 `allow_lan_plaintext`。
- 鸿蒙 `network_config.json` 默认 `cleartextTrafficPermitted: false`，仅回环放行。

## 5. 桥白名单

- 鸿蒙 `DshBridge` 白名单：`app.version`、`storage.*`、`clipboard.*`、`network.status`、`external.openUrl`、`share.open`、`diagnostics.export`。
- 未知方法返回 `UNSUPPORTED`，不抛异常到 H5。

## 6. 平台边界

- `npm run check:boundary`：业务层无 `@tauri-apps`、裸 `fetch`、`localStorage`、平台分支。

## 7. 待真机补充

- TLS 证书锁定与代理检测
- 鸿蒙桥白名单运行时核对
- 应用签名与商店安全审核回执