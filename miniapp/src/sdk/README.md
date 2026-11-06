# 小程序协议 SDK 复用说明

本目录用于放置**从 desktop 复制而来的纯 TS 协议层**，小程序侧只实现传输适配，不复制 UI。

## 复制清单

```text
dsh-java-desktop/src/lib/protocol.ts        → src/sdk/protocol.ts
dsh-java-desktop/src/platform/transport.ts  → src/sdk/transport.ts
dsh-java-desktop/src/platform/result.ts     → src/sdk/result.ts
dsh-java-desktop/src/platform/connection.ts → src/sdk/connection.ts
dsh-java-desktop/src/types.ts               → src/sdk/types.ts
```

## 小程序传输实现

```ts
// src/sdk/miniapp_transport.ts
import Taro from "@tarojs/taro";
import type { transport, transport_request } from "./transport";

export function create_miniapp_transport(): transport {
  return {
    kind: "browser",
    async request(req: transport_request): Promise<Response> {
      const res = await Taro.request({
        url: req.url,
        method: req.method as never,
        header: req.headers,
        data: req.body,
      });
      return new Response(JSON.stringify(res.data), {
        status: res.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    },
    async stream() {
      throw new Error("小程序不支持流式读取，使用对账轮询");
    },
    cancel() {},
    set_credential() {},
  };
}
```

## 约束

- 小程序**不支持流式增量读取**，流式对话降级为提交 + 轮询对账（复用 `stream_recovery` 的 5s 对账思路）。
- 凭据不落本地：由 `Taro.login` 换取的服务端会话持有。
- 任何新增协议字段必须同步 `desktop` 与 `dsh-java` 契约，禁止小程序侧私自定义。