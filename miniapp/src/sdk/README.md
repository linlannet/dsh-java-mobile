# 小程序协议 SDK

小程序侧只实现**传输与 API 封装**，不复制 desktop 的 DOM 组件与浏览器专属类型。

## 已落地

| 文件 | 作用 |
| --- | --- |
| `http.ts` | 统一请求封装：`Taro.request` + 服务端 `Response` 信封校验（`code=00000`），非 HTTPS 直接拒绝 |
| `auth.ts` | 微信登录（`Taro.login` → `/api/miniapp/login`）、会话存取、订阅消息 |
| `device.ts` | 设备配对、移动访问开关、设备列表、轮换与吊销 |

## 协议复用边界

- **复用**：后端契约（`/api/devices/*`、`/api/miniapp/login`）、`Response` 信封语义、业务字段命名
- **不复用**：desktop 的 `transport.ts`/`result.ts` 中依赖 DOM `Response`/`ReadableStream` 的类型，小程序无对应实现
- **不复用**：所有 UI 组件；小程序页面独立实现

## 约束

- 小程序仅允许 **HTTPS**（本地调试可在开发者工具关闭域名校验）
- 不支持流式增量读取 → 流式对话降级为提交 + 5s 对账轮询
- 凭据不落本地：由 `Taro.login` 换取的服务端会话持有
- 任何新增协议字段必须同步 `desktop` 与 `dsh-java` 契约，禁止小程序侧私自定义