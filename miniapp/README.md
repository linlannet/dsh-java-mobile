# dsh-java-miniapp（微信小程序壳）

基于 Taro 4 + React 的小程序壳，**复用 desktop 的协议层与业务模型，不新建第二套 UI 栈**。

## 构建

```bash
cd miniapp
npm install
npm run build:weapp     # 产物在 miniapp/dist
```

用微信开发者工具打开 `miniapp/`（`project.config.json` 的 `miniprogramRoot` 指向 `dist/`）。

## 协议复用

小程序不能直接使用 Tauri/浏览器专属实现，按以下边界复用：

| 复用来层 | 来源 | 说明 |
| --- | --- | --- |
| 协议类型与信封 | `dsh-java-desktop/src/lib/protocol.ts`、`src/platform/result.ts` | 纯 TS，直接复制到 `src/sdk/` |
| 业务模型类型 | `dsh-java-desktop/src/types.ts` | 纯类型，直接复制 |
| 传输接口 | `dsh-java-desktop/src/platform/transport.ts` | 已落地 `src/sdk/http.ts`（`Taro.request` 信封封装） |
| 设备与登录 | — | 已落地 `src/sdk/device.ts`（配对/设备管理）、`src/sdk/auth.ts`（微信登录/订阅消息） |
| 契约 fixtures | `dsh-java/docs/spec/0.2.2/contract/fixtures` | 测试期引用，不打入包体 |
| UI 组件 | `dsh-java-desktop/src/components/*` | 小程序**不复用 DOM 组件**，仅复用业务语义 |

详见 `src/sdk/README.md`。

## 域名白名单与登录态

1. 微信公众平台 → 开发管理 → 服务器域名：配置 Agent 的 **HTTPS** 域名（小程序仅允许 HTTPS）。
2. 本地联调可勾选「不校验合法域名」（仅开发工具）。
3. 登录态：使用 `Taro.login` + 自有服务端换取会话，不依赖 Cookie。
4. 订阅消息：任务完成提醒需申请模板并取得用户订阅授权。

## 包体与能力降级

- 主包建议 ≤ 2MB；大依赖按需分包。
- 能力降级：无安全存储、无 Git、无本地文件；诊断导出精简。
- 禁止远程脚本与热更新，所有逻辑随小程序版本发布。

## 已知限制

- 已接入：请求层 `src/sdk/http.ts`、微信登录 `src/sdk/auth.ts`、设备管理 `src/sdk/device.ts`；首页已具备服务器地址输入与登录状态展示（`50300` 会提示未配置微信凭证）。
- 仍需：`npm install`、微信开发者工具预览、后端 HTTPS 域名、`DSH_MINIAPP_WECHAT_APPID` / `DSH_MINIAPP_WECHAT_SECRET`。
- 未实现：会话列表/对话页、订阅消息页面、分包拆分。
- 需 `npm install` 与微信开发者工具真机预览后才能验收。