# DSH 多端演进编码任务清单

> 文档类型：编码任务规划（Tasks，第三阶段产物）
> 特性标识：`mobile_app_evolution`
> 输入：`docs/specs/mobile_app_evolution/spec.md`（1540 行，含平台决策与附录 A–F）、`cleanup-record.md`、`docs/specs/mobile_debug/spec.md`（事实参考）、`dsh-java-desktop` 实读核验
> 基线工程：`dsh-java-desktop` 0.2.2（Tauri 2 + React 19）、`dsh-java` 0.2.2（Spring Boot）、`dsh-java-mobile`（已清理，仅保留 `docs/` 与 `legacy/kmp/`）
> 状态：待评审
> 边界：本文件只定义"做什么、做到什么程度"，不包含代码实现；编码由后续执行代理按任务逐项完成。

## 0. 规划基线与约定

### 0.1 输入说明与约束

1. 本阶段仓库中**未发现独立 `design.md`**。任务中的目录、接口与文件路径均取自 `spec.md` 第 4/5/6 章、附录 A–F，以及本次对 `dsh-java-desktop`、`dsh-java`、`legacy/kmp` 的实读核验；若后续补充设计文档，以其为准并回写本清单。
2. **UI 单一事实源**：唯一 React 工程为 `dsh-java-desktop`。`dsh-java-mobile` 只承载壳工程、桥实现与产物副本，**不得新建第二个 React 入口工程**（禁止 `mobile/src/*.tsx` 之类的分叉）。
3. **产物消费方式**：`dsh-java-desktop` 构建一次 → CI 产出制品 → `dsh-java-mobile/h5-dist/`（仅 CI 注入，不入库）→ Android/iOS 通过 Tauri `frontendDist` 内嵌，HarmonyOS 通过 `rawfile/h5/` 内嵌。
4. **legacy 定位**：`dsh-java-mobile/legacy/kmp/` 为冻结区，不参与构建。SSH/Relay/安全存储/扫码实现**仅作行为参考**，不复用 Kuikly UI、不复用 KMP 协议层。
5. 包名沿用现有 `net.linlan.dsh`（服务端为 `net.linlan.dsh.*`），不因组织偏好改包。

### 0.2 本次实读核验的事实基线

| 事实 | 证据位置 | 规划含义 |
| --- | --- | --- |
| Vite 未设置 `base`，默认 `/`；`dist/index.html` 引用 `/assets/index-BiIg7f6g.js`、`/assets/index-CIwQPUW1.css`、`/dsh-icon.png` | `dsh-java-desktop/vite.config.ts`、`dist/index.html` | P0 必须改为相对基址 |
| 前端对 Tauri 直依赖为 **13 个文件、16 处 import**（`invoke`、`getCurrentWindow`、`getVersion`、`plugin-http`、`plugin-updater`） | `grep -rn "@tauri-apps" src` | 适配层收敛范围明确 |
| `agent-client.ts` 725 行，存在 **5 处绕过 `httpFetch` 的请求**（行 24、35、81、246、568） | `src/lib/agent-client.ts` | 传输抽象必须覆盖健康检查、REST、JAR 分析、扩展上传 |
| `digital-human-client.ts` 830 行，静态 import `invoke` 与 `plugin-http`，并直接调用 `save/read/delete_credential` | `src/lib/digital-human-client.ts` | 凭据与传输必须同时下沉 |
| `room-feed.ts` 291 行，无原生依赖 | `src/lib/room-feed.ts` | 可低成本接入传输接口 |
| `App.tsx` 4076 行，`agent_status`/`start_agent` 驱动服务状态；移动端无此语义 | `src/App.tsx` | 连接/Runtime 获取逻辑需与业务编排拆分 |
| `lib.rs` 1890 行，**26 个已注册命令**（进程 3、Git 5、文件目录 8、系统能力 10） | `src-tauri/src/lib.rs` | 移动端只复用系统能力子集，进程/Git 标记不支持 |
| `localStorage` 实测 **64 处** | `grep -rn localStorage src` | 存储适配工作量大于 spec 初估（30 余处） |
| CSS 断点集中在 900/960/980/1080/1180/1280，无 360–430px 断点 | `src/styles.css` | 窄屏布局为新增工作 |
| 前端无路由库（无 `react-router`/`pushState`） | `grep` 结果为空 | 鸿蒙无需 history 回退，按单页应用处理 |
| `dist` 总字节约 **4.30 MB**（入口 1.12MB、第二个 index chunk 1.14MB、echarts 1.12MB、xlsx 0.43MB、mammoth 0.31MB、css 0.18MB） | `du`/`ls dist/assets` | 已逼近/超出 4MB 预算，需体积门禁与懒加载 |
| `dsh-java` CORS 为 `allowedOriginPatterns("*")`、`allowCredentials(false)`，鉴权为 `X-API-Key`/`Bearer` | `WebMvcConfig.java`、`ApiKeyAuthInterceptor.java` | 纯 H5 跨源可行；不使用 Cookie |
| `dsh-java` **没有移动设备配对/吊销接口**（仅飞书 pairing） | 全仓检索 | 设备配对为服务端新增能力（P0/M2 阻塞） |
| 契约 fixtures 共 **7 份**，含 `feishu-bots.json` | `dsh-java/docs/spec/0.2.2/contract/fixtures` | 契约测试须覆盖 7 份 |
| `legacy/kmp/ohosApp` 无任何 ArkWeb `Web` 组件（入口为 Kuikly `Index.ets`） | `grep "Web(" legacy/kmp/ohosApp` 无结果 | 鸿蒙容器与桥均为新建 |
| 旧鸿蒙 `network_config.json` 全局允许明文；Android `network_security_config.xml` 全局允许明文；iOS `NSAllowsArbitraryLoads=true` | `legacy/kmp/...` | 三端传输策略均需收紧 |
| 归档 CI 为 `contract-test.yml`（Gradle `:shared:jsNodeTest`）与 `release.yml`（Android/iOS 打包） | `legacy/kmp/.github/workflows/` | CI 需按新栈重建 |
| `src-tauri/icons/android`、`icons/ios` 全套图标已存在，`lib.rs` 已有 `mobile_entry_point` | `src-tauri/icons`、`lib.rs:1859` | Android/iOS 图标与入口预留可直接复用 |

### 0.3 里程碑

| 里程碑 | 目标 | 覆盖任务组 | 出口标准 | 并行关系 |
| --- | --- | --- | --- | --- |
| **M0 前置阻塞解除** | 产物可脱离根路径、可脱离 Tauri 运行；协议层可注入传输 | 1、2 | `dist` 在子路径/浏览器可加载；业务层无 `@tauri-apps` 直依赖；无裸 `fetch`；契约与能力契约成型 | 1 与 2 可部分并行（1.1–1.4 与 2.6/2.8 无相互依赖） |
| **M1 H5 单一产物** | 一次构建、四处消费；窄屏可用；产物体积/安全门禁 | 3、4 | 产物哈希/元数据齐全；体积与远程代码扫描通过；360px 闭环 | 4 可与 3 并行 |
| **M2 Android 壳闭环** | Tauri 2 Mobile + 同一产物，真机完成连接—对话—流式—审批 | 5、8、9（Android 部分） | Android 真机闭环；凭据/文件/通知/明文策略通过 | 与 M3、M4 可并行，依赖 M1 |
| **M3 鸿蒙壳闭环** | ArkTS 壳 + ArkWeb 加载同一产物，桥覆盖必需能力 | 6、9（鸿蒙部分） | 附录 F 20 项通过；六项实测无阻断 | 与 M2/M4 并行；准入为 3.8 实测结论 |
| **M4 iOS 壳闭环** | Tauri 2 Mobile iOS + Keychain/ATS/TestFlight | 7、9（iOS 部分） | TestFlight 闭环；公网明文被 ATS 阻断 | 与 M2/M3 并行；依赖 5.1 共享 Rust 壳 |
| **M5 发布** | 工程基建、版本/能力矩阵、发布校验与回滚 | 10、11、12（可选） | 三端可构建可回滚；四端产物哈希一致；商店物料齐备 | 10 可与 M2–M4 穿插；11 在末端 |

### 0.4 关键路径与依赖

```
关键路径（最长链，Android 主线）：
1.1 → 1.2 → 1.4 → 2.8 → 1.5 → 1.6 → 1.7 → 1.8 → 1.10 → 2.11 → 1.11 → 1.12
    → 2.9 → 2.10 → 3.1 → 3.2 → 5.1 → 5.3 → 5.6 → 5.12 → 5.13
    → 11.2 → 11.5 → 11.8

鸿蒙支线（M3 准入前置）：
3.8 → 6.1 → 6.2 → 6.3 → 6.5 → 6.6/6.7 → 6.10 → 6.15 → 11.3 → 11.4

并行支线：
- 1.1/1.2/1.3 与 1.4/2.8 可并行（产物基址 vs 传输/能力契约）
- 2.6/2.7（契约 fixtures）可独立先行
- 3.x（产物流水线）与 4.x（窄屏适配）并行
- 5.x（Android）、6.x（鸿蒙）、7.x（iOS）在 M1 后三线并行
- 8.1/8.2（服务端配对）可在 M0 期间独立开发，8.3–8.7 依赖 2.8/2.9
- 9.1/9.2（SSH）依赖 5.3；9.5（鸿蒙扫码）依赖 6.5
- 10.x 可与 5.x/6.x/7.x 穿插；11.x 必须在三端闭环后
```

### 0.5 需求覆盖映射

| spec 章节 | 覆盖任务组 | 说明 |
| --- | --- | --- |
| 4.1 性能 | 3.3、4.1–4.4、11.5 | 冷启动、首字节、列表、包体、内存 |
| 4.2 可靠性 | 2.4、2.5、6.10、8.5、11.5 | 断网恢复、120s 看门狗、后台释放、白屏恢复 |
| 4.3 安全性 | 1.11、2.8–2.11、5.6、5.12、6.6、6.12、7.2、8.1–8.3、11.6 | 凭据、明文、桥白名单、脱敏 |
| 4.4 可维护性 | 1.11、2.2、2.6、2.7、10.3–10.9、10.11 | 单一 SDK、能力矩阵、诊断五项 |
| 4.5 兼容性 | 1.1、2.12、8.6、10.9、11.9 | 相对基址、版本区间、系统下限 |
| 5.1 多端形态与共享边界 | 2.2、4.6、10.8、10.10 | 单一 UI 源、组件分级、能力矩阵 |
| 5.2 技术路径与演进基线 | 1.12、3.8、5.1、6.1 | 纯 H5 验证、鸿蒙可行性前置 |
| 5.3 Agent 承载与连接管理 | 8.4–8.8、9.1–9.3 | 连接配置、状态机、SSH/Relay |
| 5.4 UI 复用与平台适配层 | 1.11、2.8–2.11、4.1–4.7 | 适配层唯一入口、窄屏、能力探测 |
| 5.5 协议复用与客户端 SDK | 1.4–1.9、2.1–2.7 | 连接对象、信封、事件、流式、错误 |
| 5.6 鉴权与设备配对 | 8.1–8.3、9.4、9.5 | 配对码、设备凭据、扫码 |
| 5.7 小程序适配 | 12.1–12.3 | 可选交付形态 |
| 5.8 发布与版本联动 | 3.1、10.8、10.9、11.8、11.9 | 哈希、矩阵、灰度、回滚 |
| 5.9 同一份 H5 产物 | 1.1–1.3、3.1–3.8、11.2 | 相对基址、清单、哈希、体积、离线 |
| 5.10 平台适配能力契约 | 2.8–2.12、5.6–5.10、6.6–6.9、7.3–7.5 | 14 个能力域、29 个方法 |
| 5.11 HarmonyOS 壳 | 6.1–6.15、11.3、11.4 | 容器、桥、权限、明文、恢复 |
| 附录 D 能力矩阵 | 2.8、2.10、10.8 | 逐项状态与降级说明 |
| 附录 F 验收清单 | 11.4 | H-01–H-20 |

### 0.6 编号、级别与验收约定

- 编号：主任务 `1..12`，子任务 `x.y`；编号不复用。
- 级别：**必须** = 不完成则里程碑不成立；**建议** = 首版可延后但需登记；**可选** = 不阻塞三端发布。
- 每个子任务统一字段：级别、涉及文件/路径、改动或产出、前置依赖、验收标准。
- `- [ ]` 为该子任务的完成标记；字段不替代验收，验收必须可执行、可观察。
- "涉及文件"中标注 `新建` 的路径为规划建议路径，编码时可微调，但不得改变仓库边界（UI 只在 desktop，壳只在 mobile）。

---

## 1. [M0] 产物基址与纯 H5 可运行（P0 阻塞）

> 目标：解除"产物只能跑在站点根 + 只能跑在 Tauri 里"两个死结。本组不完成，鸿蒙/Android/iOS 全部无法启动。

- [x] **1.1 Vite 构建基址改为相对路径**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/vite.config.ts`
  - 改动/产出：设置 `base: "./"`；保持 `build.assetsDir` 默认 `assets`；不改 `server.port=1420`；不引入 `import.meta.env` 基址变量。
  - 前置依赖：无
  - 验收标准：`npm run build` 成功；`dist/index.html` 的 script/link 均为 `./assets/...`；将 `dist` 复制到任意子目录（如 `/tmp/x/sub/h5/`）后用静态服务器访问，入口、JS、CSS 均 200。

- [x] **1.2 入口 HTML 资源引用相对化**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/index.html`、`dsh-java-desktop/public/dsh-icon.png`
  - 改动/产出：`/dsh-icon.png?v=...` 改为 `./dsh-icon.png?v=...`（favicon 与 apple-touch-icon 两处）；不加 `<base href>`（会破坏子路径相对解析）；保留现有启动错误浮层。
  - 前置依赖：1.1
  - 验收标准：构建后 `grep -E '(src|href)="/' dist/index.html` 无结果；子路径加载时图标 200；控制台无 404。

- [x] **1.3 产物绝对路径与调试残留扫描**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/scripts/check_h5_artifact.mjs`（新建）
  - 改动/产出：扫描 `dist` 的 html/js/css，禁止 `src="/`、`href="/`、`url(/`、`file://`、`/Users/`、`C:\\`、`.map`、测试 fixtures 进入产物；输出 `artifact_manifest.json`（相对路径、字节数、sha256）。
  - 前置依赖：1.1
  - 验收标准：当前未改造的 `dist` 运行脚本退出码非 0 并列出违规；改造后退出 0；清单中无绝对路径。

- [x] **1.4 定义可注入传输接口 `Transport`**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/src/platform/transport.ts`（新建）
  - 改动/产出：定义 `TransportRequest`（url/method/headers/body/signal/timeout_ms/response_type）、`TransportResponse`（status/headers/text/json/stream_reader）、`Transport`（`request`、`stream`、`cancel`、`kind`）；不依赖任何 `@tauri-apps/*`。
  - 前置依赖：无
  - 验收标准：`tsc` 通过；类型单测覆盖 request/stream/cancel 三方法；`grep "@tauri-apps" src/platform/transport.ts` 无结果。

- [x] **1.5 `http.ts` 重构为传输选择层**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/src/lib/http.ts`、`src/platform/impl/browser_transport.ts`（新建）、`src/platform/impl/tauri_transport.ts`（新建）
  - 改动/产出：`httpFetch` 改为委托 `getTransport().request`；原"原生 fetch 优先 + plugin-http 回退（按源记忆 60s）"整体迁入 `tauri_transport`；`setLocalApiKey` 改为连接对象的凭据注入钩子；浏览器实现只使用 `window.fetch`。
  - 前置依赖：1.4
  - 验收标准：现有调用点不改也能编译；纯浏览器构建不加载 tauri 实现（动态 import 或条件加载）；`vitest` 通过；桌面端对话回归通过。

- [x] **1.6 收敛 `agent-client.ts` 的 5 处裸 `fetch`**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/src/lib/agent-client.ts`（行 24、35、81、246、568）
  - 改动/产出：健康检查 2 处、REST 1 处、JAR 分析 1 处、扩展上传 1 处全部改走 `Transport`；`window.fetch` 直调删除；鉴权头统一由传输层注入；FormData/二进制上传保持可用。
  - 前置依赖：1.5
  - 验收标准：`grep -n "fetch(" src/lib/agent-client.ts` 无业务调用（仅允许注释）；插件 JAR 分析、扩展 ZIP 上传、健康检查、普通 REST 各跑一次；契约测试通过。

- [x] **1.7 协议入参由 `port` 改为连接对象**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/src/lib/agent-client.ts`、`src/App.tsx`、调用 `agent-client` 的组件
  - 改动/产出：新增 `AgentConnection`（id、base_url、channel、auth_ref、extra_headers）；删除 `baseUrl(port)`；所有导出函数首参改为 `connection`；App 从 `agent_status` 拿到端口后构造 `LOCAL` 连接对象；`digital-human-client` 的 `baseUrl(port)` 同步处理（见 1.8）。
  - 前置依赖：1.6
  - 验收标准：`grep -rn "127.0.0.1\|localhost\|8090\|3080" src/lib` 为 0；`tsc` 通过；桌面端"连接—会话—对话—审批"回归通过；同一连接对象在浏览器/桌面产生相同请求路径。

- [x] **1.8 `digital-human-client.ts` 的 Tauri 依赖下沉**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/src/lib/digital-human-client.ts`
  - 改动/产出：移除 `import { invoke }` 与 `import { fetch as pluginFetch }`；`save/read/delete_credential` 改调平台 `credential.*`；远端健康检查与 Agent Card 探测改走 `Transport`；`baseUrl(port)` 改连接对象。
  - 前置依赖：1.5
  - 验收标准：`grep -n "@tauri-apps" src/lib/digital-human-client.ts` 为 0；数字人列表、房间事件流、凭据读写回归通过。

- [x] **1.9 `room-feed.ts` 接入传输接口并复核续传**
  - 级别：建议
  - 涉及文件：`dsh-java-desktop/src/lib/room-feed.ts`
  - 改动/产出：确认无原生依赖；重连/续传统一走 `Transport.stream`；保留 `afterSeq` 去重；补一条"流式中断→对账"单测。
  - 前置依赖：1.4
  - 验收标准：模拟断流后消息不重复、不丢失；单测通过。

- [x] **1.10 业务层 `@tauri-apps/*` 全部下沉（13 文件 / 16 处）**
  - 级别：必须
  - 涉及文件：`src/App.tsx`、`src/components/{ArtifactPreview,ConversationView,DiffView,DirTreeView,DrawioPreview,FileActionsMenu,FilePreview,InfoRail,RoomCollaborationView,UpdateStatusBadge}.tsx`、`src/platform/impl/tauri_native.ts`（新建）、`src/platform/capabilities.ts`（新建）
  - 改动/产出：`invoke` 统一收口到 `tauri_native`；`getCurrentWindow`、`getVersion`、`plugin-updater check` 分别映射到 `lifecycle`、`app_info`、`update` 能力；业务组件只调用能力契约。
  - 前置依赖：1.5、2.8（能力契约类型先行，允许并行）
  - 验收标准：`grep -rn "@tauri-apps" src --include="*.tsx" --include="*.ts"` 仅命中 `src/platform/impl/`；`tsc` 通过；桌面端文件预览、审批、更新提示、窗口行为回归通过。

- [x] **1.11 平台边界静态门禁**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/scripts/check_platform_boundary.mjs`（新建）、`package.json`（`check:boundary`）
  - 改动/产出：禁止 `src/components/**`、`src/App.tsx`、`src/lib/**` 出现 `@tauri-apps`、裸 `fetch(`、直接 `localStorage`、`if (platform === ...)`；违规输出文件:行号并非 0 退出。
  - 前置依赖：1.7、1.10、2.11
  - 验收标准：改造前可列出违规清单；改造后 0 违规；CI 接入后违规阻断合并。

- [x] **1.12 无 Tauri 运行时的纯 H5 闭环验证**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/tests/browser-stub-init.js`、`tests/unit/h5_smoke.test.ts`（新建）、`scripts/h5_smoke.mjs`（新建）
  - 改动/产出：在无 `window.__TAURI_INTERNALS__` 的浏览器环境加载 `dist`；能力表返回浏览器实现；完成"打开连接页—手工填地址—健康检查"最小闭环；控制台不得出现未捕获异常。
  - 前置依赖：1.7、1.8、1.10
  - 验收标准：`npm run preview` 打开页面不白屏；`grep "invoke is not a function"` 无命中；能力探测显示 `transport=AVAILABLE`、`credential=DEGRADED`、`git=UNAVAILABLE`。

---

## 2. [M0] 共享层与契约

> 目标：把协议、类型、能力契约收敛为单一事实源；为三端壳提供稳定接口。

- [x] **2.1 定义连接配置与连接对象**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/src/platform/connection.ts`（新建）、`src/types.ts`
  - 改动/产出：按 spec 6.1 定义 `ConnectionProfile`（id、name、channel、base_url、auth_mode、credential_ref、last_status、last_used_at）；校验 `HTTPS` 必须 `https://`、`LOCAL` 必须回环、名称 1–40 字符。
  - 前置依赖：1.7
  - 验收标准：8 个字段齐全；非法 URL/通道/空名称有单测；凭据字段只允许引用，不允许明文。

- [x] **2.2 协议 SDK 收敛为单一导出面**
  - 级别：必须
  - 涉及文件：`src/lib/protocol.ts`（新建 barrel）、`src/lib/agent-client.ts`、`src/lib/http.ts`、`src/lib/room-feed.ts`、`src/lib/digital-human-client.ts`
  - 改动/产出：不改目录、不复制模型，统一从 `src/lib/protocol.ts` 导出协议能力；桌面与三端壳消费同一份；禁止出现 `agent-client.mobile.ts` 之类副本。
  - 前置依赖：1.7、1.8
  - 验收标准：仓库仅一个 React 入口；`grep -rn "agent-client.mobile"` 无结果；所有协议 import 指向 barrel 或原文件。

- [x] **2.3 统一信封与错误模型**
  - 级别：必须
  - 涉及文件：`src/lib/protocol.ts`、`src/platform/result.ts`（新建）
  - 改动/产出：`ApiEnvelope<T>{code,info,data}`；`ProtocolError` 固定类型 `AUTH / FORBIDDEN / NOT_FOUND / SERVER / TIMEOUT / NETWORK / CONTRACT / ABORTED`；保留 `info` 作为可展示原因；不向 UI 抛原始 JSON/堆栈。
  - 前置依赖：2.2
  - 验收标准：构造 401/403/404/500/超时/断网六类响应，映射类型稳定；UI 提示文案可读；单测覆盖。

- [x] **2.4 事件模型、`seq` 单调与缺口补拉**
  - 级别：必须
  - 涉及文件：`src/lib/agent-client.ts`、`src/lib/room-feed.ts`
  - 改动/产出：事件名白名单 11 个（meta/chunk/reasoning/tool/tool_result/approval/question/finish/done/step_break/error）；重复事件丢弃；`seq` 跳号暂停投影并按 `afterSeq` 补拉；补齐后恢复。
  - 前置依赖：2.3
  - 验收标准：注入重复、乱序、缺口三组 fixture，界面不重复、不回退；补拉后内容完整。

- [x] **2.5 流式稳定性：超时、看门狗、对账、退避**
  - 级别：必须
  - 涉及文件：`src/lib/agent-client.ts`、`src/platform/transport.ts`
  - 改动/产出：连接超时 15s；已建立后 120s 无字节触发空闲中断；对账轮询 5s；重连退避 1s→15s 封顶；连续失败 3 次进入退避并允许手动重试；保留 `StreamIdleError` 语义。
  - 前置依赖：2.3
  - 验收标准：模拟服务端静默 120s 转对账；模拟断网退避曲线正确；手动重试立即生效；对账后消息与服务端一致。

- [x] **2.6 契约 fixtures 单一事实源与 `feishu-bots` 覆盖**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/tests/unit/contract.test.ts`、`dsh-java/docs/spec/0.2.2/contract/fixtures/*.json`
  - 改动/产出：7 份 fixtures（session-list、session-timeline、stream-events、approvals-questions、digital-humans、room-events、feishu-bots）统一 `contractVersion=1`；补齐 `feishu-bots` 字段断言；移动端不复制 fixtures。
  - 前置依赖：无
  - 验收标准：7 份全部被测试引用；`feishu-bots` 至少断言 botId/name/enabled/agentBaseId；fixtures 缺失时测试显式失败（发布流水线不允许 skip）。

- [x] **2.7 契约测试参数化到五端**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/tests/unit/contract.test.ts`
  - 改动/产出：同一 fixtures、同一事件白名单，按 `desktop/android/ios/harmony/mini` 五宿主参数化；断言请求路径、信封处理、事件解析一致；不允许按宿主分支复制模型。
  - 前置依赖：2.6、2.2
  - 验收标准：5 组用例通过；报告中每个宿主均有 fixture 覆盖；无新增宿主专属协议文件。

- [x] **2.8 平台适配层契约：14 个能力域 / 29 个方法**
  - 级别：必须
  - 涉及文件：`src/platform/contract.ts`（新建）、`src/platform/capabilities.ts`（新建）
  - 改动/产出：定义 14 域——`transport`、`credential`、`file`、`export_share`、`external_open`、`notify`、`clipboard`、`network`、`app_info`、`lifecycle`、`deeplink`、`git`、`diagnostics`、`storage`；覆盖附录 D 的 29 个方法（transport.request/stream/cancel、credential.save/read/delete/exists、file.pick/readText/readBinary/writeText/stat/listDir、file.export、share.open、external.openUrl/openFile/reveal、notify.send/permission、clipboard.write/read、net.status/onChange、app.version、update.check、lifecycle.onForeground/onBackground、deeplink.onOpen/parse、git.branch/branches/switch/changes/diff、diagnostics.export）+ `storage.get/set/remove/clear`。
  - 前置依赖：1.4
  - 验收标准：类型文件逐项对照附录 D，无缺项；每方法有输入/输出/超时/取消语义注释；`tsc` 通过。

- [x] **2.9 统一返回模型与超时/取消语义**
  - 级别：必须
  - 涉及文件：`src/platform/result.ts`
  - 改动/产出：`CapabilityResult<T> = OK | UNSUPPORTED | DENIED | CANCELLED | FAILED`；`diagnostic_id`、`message`、`code`；默认超时 15s；超时返回 `FAILED(timeout)`，用户取消返回 `CANCELLED`，两者可区分。
  - 前置依赖：2.8
  - 验收标准：五类结果各有 UI 表现；`CANCELLED` 不弹错误；超时释放等待状态，不累积重复点击。

- [x] **2.10 能力探测表与桥协议版本协商**
  - 级别：必须
  - 涉及文件：`src/platform/capabilities.ts`、`src/platform/version.ts`（新建）
  - 改动/产出：启动时读取 `CapabilityTable`（capability、state=AVAILABLE/DEGRADED/UNAVAILABLE、bridge_version、host）；页面声明要求的 `bridge_version`；壳拒绝不在支持区间的版本并返回 `UNSUPPORTED`；移除桥后按缺失降级。
  - 前置依赖：2.8、2.9
  - 验收标准：五宿主能力表与真实调用一致；未知方法/版本被拒；移除鸿蒙桥后页面不崩溃、入口隐藏或置灰。

- [x] **2.11 本地存储适配（覆盖 64 处 `localStorage`）**
  - 级别：必须
  - 涉及文件：`src/platform/storage.ts`（新建）、全前端 `localStorage` 调用点
  - 改动/产出：提供 `storage.get/set/remove/clear`；DOM 存储不可用或配额耗尽时退化为内存态并提示"本地记录不可保存"；保留 `dsh-*` 键语义；凭据类数据禁止走此层。
  - 前置依赖：2.8
  - 验收标准：禁用 DOM 存储启动不崩溃；偏好/草稿降级提示；`grep -rn "localStorage" src` 仅命中 `src/platform/storage.ts`（或统一封装文件）。

- [x] **2.12 壳与产物版本兼容校验**
  - 级别：建议
  - 涉及文件：`src/platform/version.ts`、`artifact_manifest.json`（3.1 产出）
  - 改动/产出：产物声明 `min_bridge_version`/`artifact_version`；壳声明 `supported_artifact_range`；不兼容进入兼容/只读模式并上报诊断，不白屏。
  - 前置依赖：2.10、3.1
  - 验收标准：旧壳加载新产物提示"请升级应用"；新壳加载旧产物功能可用；诊断含版本信息。

---

## 3. [M1] 同一份 H5 产物流水线

> 目标：一次构建、四处消费；产物可审计、可离线、有体积与安全门禁。

- [x] **3.1 产物元数据与内容哈希**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/scripts/gen_artifact_meta.mjs`（新建）、`dist/artifact_meta.json`
  - 改动/产出：生成 `content_hash`（完整产物稳定算法）、`commit`、`built_at`、`contract_version=1`、`min_bridge_version`、`files[]`、`sizes`；注入"关于/诊断"页可读。
  - 前置依赖：1.2
  - 验收标准：四个宿主读取到的 `content_hash` 一致；诊断页显示哈希/提交/时间/契约四项；无本地绝对路径。

- [x] **3.2 一次构建、四处投递**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/scripts/distribute_h5.mjs`（新建）、`.github/workflows/h5_build.yml`（新建）
  - 改动/产出：CI 只执行一次 `dsh-java-desktop` 的 `npm run build`；上传制品；下游下载到 `dsh-java-mobile/h5-dist/`；Android/iOS 由 Tauri `frontendDist` 消费，鸿蒙复制到 `harmony/entry/src/main/resources/rawfile/h5/`；构建日志保留"仅一次前端构建"证据。
  - 前置依赖：3.1
  - 验收标准：流水线只有一次前端 build 任务；四个宿主包内 `artifact_meta.json` 哈希一致；`h5-dist/` 不入库。

- [x] **3.3 产物体积门禁**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/scripts/check_h5_size.mjs`（新建）、`dsh-java-desktop/src/lib/echarts-embed.ts`、`ArtifactPreview`/`FilePreview` 相关按需加载
  - 改动/产出：首屏关键资源（入口 HTML + 首屏 JS/CSS，gzip 后）≤1MB；完整产物（gzip 后）≤4MB；当前基线约 4.30MB 未压缩，需把 echarts/xlsx/mammoth 改为按需动态加载或裁剪；超标构建失败并输出明细。
  - 前置依赖：3.1
  - 验收标准：报告给出两项实测值；当前基线先记录再改造；改造后两项达标；首屏交互不因懒加载出现空白。

- [x] **3.4 远程可执行代码与 `eval` 扫描**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/scripts/check_h5_security.mjs`（新建）
  - 改动/产出：扫描 html/js，禁止远程 `<script src>`、`eval(`、`new Function`、远程动态 `import()`、热更新补丁入口；允许本地同包 chunk。
  - 前置依赖：3.1
  - 验收标准：当前产物 0 命中；CI 命中即失败；运行时抓包无远程脚本请求。

- [x] **3.5 离线加载与无 CDN 校验**
  - 级别：必须
  - 涉及文件：`scripts/h5_offline_check.mjs`（新建）
  - 改动/产出：断网冷启动加载本地入口与首屏资源；页面显示"离线/未连接"；不得依赖 CDN、远程字体、远程图标。
  - 前置依赖：3.1
  - 验收标准：断网启动首屏可渲染；网络面板无外部请求；离线态提示明确。

- [x] **3.6 内嵌与同源托管产物一致性（可选分发模式）**
  - 级别：可选
  - 涉及文件：`dsh-java-mobile/scripts/verify_hosted_hash.mjs`（新建）、`dsh-java` 静态托管入口
  - 改动/产出：支持 `EMBEDDED` 与 `HOSTED` 两种分发；两者内容哈希必须一致；切换分发不改业务代码。
  - 前置依赖：3.2
  - 验收标准：两种模式哈希一致；切换后页面无 404；不引入远程可执行代码。

- [x] **3.7 产物清单文档**
  - 级别：必须
  - 涉及文件：`docs/specs/mobile_app_evolution/artifact_manifest.md`（新建）
  - 改动/产出：记录入口、脚本、样式、字体、图标、静态图片的相对路径与体积；记录哈希、提交、构建时间、契约版本、最低桥版本；明确排除 sourcemap/测试数据/绝对路径。
  - 前置依赖：3.1
  - 验收标准：清单与 `artifact_manifest` 一致；无绝对路径/用户名；可作为发布审计依据。

- [ ] **3.8 鸿蒙容器六项可行性实测（M3 准入）**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/harmony_poc/`（新建临时最小工程）、`docs/specs/mobile_app_evolution/harmony_poc_record.md`（新建）
  - 改动/产出：逐项实测 POST SSE 增量读取、`<input type="file">` 选择、Blob/大文件下载、`resource://rawfile` 或自定义 scheme 加载、DOM 存储持久化、HTTPS 页面请求 HTTP 局域网（混合内容）；每项给出"通过/降级/阻断"+设备型号/系统版本/内核版本+证据。
  - 前置依赖：1.1、3.2
  - 验收标准：六项均有结论与证据；阻断项有降级方案并通过评审；未通过项不得进入 M3 实现（可先做降级路径）。

---

## 4. [M1] 窄屏、触控与移动布局（H5 层，三端共用）

> 目标：同一份产物在 360px 宽度可用；差异通过布局与能力探测表达，不做端判断。

- [x] **4.1 新增 360–430px 断点与移动布局变量**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/src/styles.css`
  - 改动/产出：新增 `@media (max-width: 480px)`、`(max-width: 430px)`；新增 `--safe-area-*`、`--touch-min: 44px`、`--mobile-gutter`；保持 900/960/980/1080/1180/1280 既有断点行为。
  - 前置依赖：无
  - 验收标准：360×640 视口无横向滚动；1440 桌面布局与改造前一致（截图对比）。

- [x] **4.2 三栏布局改为移动单列 + 抽屉**
  - 级别：必须
  - 涉及文件：`src/App.tsx`、`src/components/Sidebar.tsx`、`src/components/InfoRail.tsx`、`src/components/ConversationView.tsx`
  - 改动/产出：窄屏下侧边栏默认收起、以抽屉打开；信息栏改为底部 sheet；会话/对话/输入区单列；L0/L1 组件复用，L2 容器允许重写。
  - 前置依赖：4.1
  - 验收标准：360px 下完成"连接—会话列表—对话—审批/问答—发送"闭环；无遮挡、无不可点击；桌面三栏不变。

- [x] **4.3 安全区与键盘避让**
  - 级别：必须
  - 涉及文件：`src/styles.css`、`src/App.tsx`
  - 改动/产出：使用 `env(safe-area-inset-*)`；监听 `visualViewport` 调整输入区；键盘弹出时输入框滚动可见；刘海/底部指示条不遮挡。
  - 前置依赖：4.1
  - 验收标准：真机键盘弹出输入框可见；收起后布局回正；底部按钮不被指示条遮挡。

- [x] **4.4 触控目标与 hover 降级**
  - 级别：必须
  - 涉及文件：`src/styles.css` 及各组件样式
  - 改动/产出：可点击元素不小于 44×44pt；hover 效果包在 `@media (hover: hover)`；禁用文本选中误触。
  - 前置依赖：4.1
  - 验收标准：抽查 10 个主要按钮/菜单，命中区域均 ≥44×44；触控设备无 hover 残留。

- [x] **4.5 深色模式与系统字体缩放**
  - 级别：建议
  - 涉及文件：`src/styles.css`
  - 改动/产出：`prefers-color-scheme: dark` 变量；字号使用 rem；`-webkit-text-size-adjust`；200% 字体不破版。
  - 前置依赖：4.1
  - 验收标准：深色模式核心页面可读；200% 字体无重叠；切换即时生效。

- [x] **4.6 组件分级与复用率盘点**
  - 级别：必须
  - 涉及文件：`docs/specs/mobile_app_evolution/ui_reuse_inventory.md`（新建）
  - 改动/产出：对 29 个组件 + `App.tsx` 标注 L0（纯展示）/L1（业务语义）/L2（页面容器）；统计复用率；列出需移动重写的 L2 容器。
  - 前置依赖：无
  - 验收标准：组件归属无遗漏；复用率按组件数计算并给出百分比；低于 70% 时列出缺口与计划。

- [x] **4.7 右键/长按菜单降级**
  - 级别：建议
  - 涉及文件：`src/components/FileActionsMenu.tsx`、`ProjectRowMenu.tsx`、`Sidebar.tsx`
  - 改动/产出：移动端以长按或"更多"按钮打开同等菜单；桌面保留右键；菜单项按能力探测隐藏 Git/定位等不支持项。
  - 前置依赖：4.2、2.10
  - 验收标准：移动端可完成文件导出/分享/删除；不支持项不出现；桌面右键回归通过。

---

## 5. [M2] Android Tauri 2 Mobile 壳

> 目标：在 `dsh-java-mobile` 建立 Android/iOS 共享 Rust 壳，Android 真机完成核心闭环。

- [ ] **5.1 建立移动端共享 Rust 壳工程**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/src-tauri/Cargo.toml`（新建）、`src/lib.rs`（新建）、`src/commands/`（新建）、`src/plugins/`（新建）、`tauri.conf.json`（新建）、`package.json`（新建，仅 Tauri CLI 脚本，不含 React 源码）
  - 改动/产出：只保留移动可复用命令（文件、凭据、通知、外部打开、分享、版本、生命周期、深链、诊断）；**不注册** `start_agent`/`stop_agent`/`agent_status`/Git 五件套/`reveal_local_file`；`package.json` 只含 `tauri` 脚本与 devDependency。
  - 前置依赖：3.2
  - 验收标准：`cargo check` 通过；命令清单与 2.8 能力映射表逐项对应；仓库不存在第二份 React 业务源码。

- [ ] **5.2 初始化 Android 工程**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/src-tauri/gen/android/`（生成）
  - 改动/产出：执行 `tauri android init`；确认 Gradle 结构、`applicationId`、最低 SDK 26、`minSdkVersion` 与 spec 4.5 一致。
  - 前置依赖：5.1
  - 验收标准：`tauri android build --debug` 产出 APK；应用可安装启动并加载 `h5-dist`。

- [ ] **5.3 移动入口与插件注册**
  - 级别：必须
  - 涉及文件：`src-tauri/src/lib.rs`、`src-tauri/capabilities/mobile.json`（新建）
  - 改动/产出：`#[cfg_attr(mobile, tauri::mobile_entry_point)]`；注册 http/clipboard/notification/deep-link/os 等插件与本仓自研插件；能力文件按最小权限声明，仅允许本地资源与所需 URL scope。
  - 前置依赖：5.1
  - 验收标准：启动进入 WebView；无 Agent 子进程；权限清单无多余项。

- [ ] **5.4 移动端 Tauri 配置**
  - 级别：必须
  - 涉及文件：`src-tauri/tauri.conf.json`
  - 改动/产出：`frontendDist: "../h5-dist"`；`identifier: "net.linlan.dsh"`（或与旧包名一致的最终确认值）；`app.security.csp` 显式配置（允许 `self`、本地资源、必要 connect-src）；移动端不配置 updater 端点；版本号与壳版本解耦。
  - 前置依赖：5.2
  - 验收标准：`tauri android build` 内嵌产物；CSP 不阻断本地 JS/CSS；无桌面专属配置（窗口、托盘、updater）。

- [ ] **5.5 Android 图标与启动屏**
  - 级别：建议
  - 涉及文件：`src-tauri/icons/android/**`、`gen/android/app/src/main/res/**`
  - 改动/产出：复用 desktop 已生成的 Android 图标；配置启动背景与应用名。
  - 前置依赖：5.2
  - 验收标准：桌面图标/启动屏正常；无默认 Tauri 图标残留。

- [ ] **5.6 Android 传输实现与混合内容策略**
  - 级别：必须
  - 涉及文件：`src/platform/impl/tauri_transport.ts`（desktop 仓库）、`src-tauri/capabilities/mobile.json`、`gen/android/.../AndroidManifest.xml`
  - 改动/产出：移动端优先原生 `fetch`，失败回退 `plugin-http`；`http` 插件 scope 允许回环/局域网/HTTPS，应用层强制公网 HTTPS；记录 `http://tauri.localhost` 页面请求内网 `http://` 的实测结论。
  - 前置依赖：1.5、5.3
  - 验收标准：局域网直连与 HTTPS 各完成一次请求；公网 `http://` 被阻断并提示；混合内容失败有明确诊断（不显示笼统"网络错误"）。

- [ ] **5.7 Android 安全存储（Keystore/EncryptedSharedPreferences）**
  - 级别：必须
  - 涉及文件：`src-tauri/gen/android/.../SecureStorePlugin.kt`（新建）、`src/platform/impl/tauri_credential.ts`（新建）
  - 改动/产出：`credential.save/read/delete/exists` 实现；凭据只以引用暴露；明文只驻留内存；禁止写入 Logcat/preferences 明文。
  - 前置依赖：2.8、5.3
  - 验收标准：保存→重启→按引用读取成功；卸载重装旧凭据不可恢复；日志与文件扫描无明文。

- [ ] **5.8 Android 文件选择、导出与分享**
  - 级别：必须
  - 涉及文件：`SecureStorePlugin.kt` 同级 `FilePlugin.kt`（新建）、`src/platform/impl/tauri_file.ts`（新建）、`FileProvider` 配置
  - 改动/产出：SAF `ACTION_OPEN_DOCUMENT`/`ACTION_CREATE_DOCUMENT`；返回宿主令牌；`file.export` 落用户可见位置；`share.open` 调系统分享；取消返回 `CANCELLED`；大文件拒绝一次性传输。
  - 前置依赖：2.8、5.3
  - 验收标准："选择文件→上传"成功；"导出→分享"成功；取消无错误提示；>限制大小给出替代路径。

- [ ] **5.9 Android 通知与权限**
  - 级别：必须
  - 涉及文件：`NotificationPlugin.kt`（新建）、`AndroidManifest.xml`（`POST_NOTIFICATIONS`，API 33+）
  - 改动/产出：`notify.permission` 查询/请求；`notify.send` 本地通知；拒绝后不重复弹窗，提供"去设置"。
  - 前置依赖：2.8、5.3
  - 验收标准：授权可收到通知；拒绝后仅站内提示；再次调用不弹系统框。

- [ ] **5.10 Android 深链、外部打开、剪贴板、网络状态、生命周期、版本**
  - 级别：必须
  - 涉及文件：`SystemPlugin.kt`（新建）、`AndroidManifest.xml`（`dsh://` intent-filter）、`src/platform/impl/tauri_system.ts`（新建）
  - 改动/产出：六项能力实现；生命周期 `onResume/onPause` 去重派发；网络类型变化一次事件；深链只接受非敏感参数；`update.check` 跳商店。
  - 前置依赖：2.8、5.3
  - 验收标准：六项各一次实测；能力表状态正确；非法深链被拒并审计；前后台事件不风暴。

- [ ] **5.11 Android 明文与网络安全配置**
  - 级别：必须
  - 涉及文件：`gen/android/app/src/main/res/xml/network_security_config.xml`、`AndroidManifest.xml`
  - 改动/产出：基线策略显式声明；回环/局域网明文受控，公网仅 HTTPS；记录"Android 无法预枚举动态内网 IP"的权衡与补偿（应用层 URL 校验 + 用户显式确认 + 传输 scope 限制）；发布检查中登记为已知限制。
  - 前置依赖：5.4
  - 验收标准：公网 `http://` 连接被阻断；局域网 `http://` 经用户确认可连；配置与 4.3-12 一致；检查单有结论。

- [ ] **5.12 Android 签名与 APK/AAB 构建**
  - 级别：必须
  - 涉及文件：`gen/android/keystore.properties`（不入库）、CI secrets、`src-tauri/gen/android/app/build.gradle.kts`
  - 改动/产出：release 签名；APK 与 AAB 双产物；版本号来自壳版本 + 构建号；不打包 Agent/JRE。
  - 前置依赖：5.11
  - 验收标准：`assembleRelease` 与 `bundleRelease` 成功；APK ≤30MB；签名校验通过；产物不含 JAR/JRE。

- [ ] **5.13 Android 真机闭环**
  - 级别：必须
  - 涉及文件：`docs/specs/mobile_app_evolution/test_records/android.md`（新建）
  - 改动/产出：连接（局域网 + HTTPS）→ 会话列表 → 对话 → 流式 → 审批/问答 → 文件选择/导出/分享 → 通知；断网恢复；后台 5 分钟回前台先对账。
  - 前置依赖：5.6–5.12
  - 验收标准：全链路一次通过；无重复消息；崩溃/白屏 0 次；诊断包可导出。

---

## 6. [M3] HarmonyOS ArkTS/ArkUI + ArkWeb 壳（方案 1）

> 目标：ArkTS 只做容器、生命周期、权限与桥；业务 UI 100% 来自同一份 H5。准入为 3.8 六项实测结论。

- [x] **6.1 建立 HarmonyOS 工程**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/harmony/AppScope/app.json5`（新建）、`harmony/entry/src/main/module.json5`（新建）、`harmony/entry/src/main/ets/entryability/EntryAbility.ets`（新建）、`harmony/hvigorfile.ts`、`harmony/oh-package.json5`
  - 改动/产出：API 12（5.0.0）及以上；`deviceTypes=phone/tablet`；唯一入口 `EntryAbility`；页面仅 `pages/Index.ets`；包名与签名配置待 spec 7.2 第 17 项 确认，默认沿用 `net.linlan.dsh`。
  - 前置依赖：3.2
  - 验收标准：`hvigorw assembleHap` 通过；安装启动不白屏；工程内无业务数据模型/业务页面。

- [x] **6.2 ArkWeb 容器创建与能力配置**
  - 级别：必须
  - 涉及文件：`harmony/entry/src/main/ets/pages/Index.ets`（新建）
  - 改动/产出：`Web({ src: $rawfile('h5/index.html'), controller })`；`javaScriptAccess(true)`、`domStorageAccess(true)`、`fileAccess(false)`、`multiWindowAccess(false)`、`zoomAccess(false)`、`mixedMode(MixedMode.All)`；设置缓存策略与媒体自动播放策略；禁止任意本地文件访问。
  - 前置依赖：6.1
  - 验收标准：H-04 通过；页面刷新后 DOM 存储仍生效；任意文件路径访问被拒；多窗口不可用。

- [x] **6.3 加载同一份产物（rawfile / 自定义 scheme）**
  - 级别：必须
  - 涉及文件：`harmony/entry/src/main/resources/rawfile/h5/**`、`scripts/distribute_h5.mjs`、`Index.ets`
  - 改动/产出：把 `h5-dist` 复制到 `rawfile/h5/`；验证 `./assets/*` 相对引用解析；若 rawfile 不支持相对路径，使用 `onInterceptRequest` 将 `/assets/*` 映射到 rawfile（或降级为 Agent 同源托管），**不得修改产物内容**；禁止第二份入口 HTML。
  - 前置依赖：1.1、6.2、3.8
  - 验收标准：H-01/H-02 通过；入口/JS/CSS/图标无 404；HAP 内资源哈希与产物清单一致。

- [x] **6.4 资源加载失败、白屏与渲染崩溃恢复**
  - 级别：必须
  - 涉及文件：`Index.ets`
  - 改动/产出：接入 `onErrorReceive`/`onHttpErrorReceive`/`onRenderExited`；内置错误页提供"重新加载 / 返回连接页 / 导出诊断"；连续崩溃两次停止自动重建并提示；不得无限白屏。
  - 前置依赖：6.2
  - 验收标准：注入资源 404、桥异常、渲染崩溃三种场景，错误页均出现；三个入口可用；崩溃后可恢复到连接页或上次会话。

- [x] **6.5 JSBridge：单命名空间、版本、白名单、超时、审计**
  - 级别：必须
  - 涉及文件：`harmony/entry/src/main/ets/bridge/DshBridge.ets`（新建）、`dsh-java-desktop/src/platform/impl/harmony_bridge.ts`（新建）
  - 改动/产出：注入单一 `window.dshBridge`（`bridge_version=1`）；方法白名单与 2.8 契约一一对应；请求 id + 15s 超时；回调 `__dsh_bridge_resolve/__dsh_bridge_reject`；未知方法/未知版本拒绝并记录审计；不提供 `exec`、任意路径读写、动态脚本执行。
  - 前置依赖：2.8、6.2
  - 验收标准：H-07/H-08 通过；未知方法被拒并留审计；版本不匹配返回 `UNSUPPORTED`；页面可读能力表与桥版本。

- [ ] **6.6 鸿蒙安全存储桥**
  - 级别：必须
  - 涉及文件：`harmony/entry/src/main/ets/bridge/CredentialBridge.ets`（新建）
  - 改动/产出：优先 Asset Store Kit（`@kit.AssetStoreKit`），回退 HUKS + preferences 加密；只暴露引用；删除/存在性检查；清除应用数据后必须重新配对；禁止写入 Web 存储/Cookie/日志。
  - 前置依赖：6.5
  - 验收标准：H-09 通过；保存/读取/删除/存在性四项正确；沙箱与 Web 存储扫描无明文。

- [ ] **6.7 鸿蒙文件选择桥（H5 原生入口）**
  - 级别：必须
  - 涉及文件：`bridge/FileBridge.ets`（新建）、`Index.ets` 的 `onShowFileSelector`
  - 改动/产出：页面 `<input type="file">` 触发系统选择器；选择结果回传页面；取消回传 `CANCELLED`；大文件走受限传输或宿主内处理；超时返回 `FAILED`。
  - 前置依赖：3.8、6.5
  - 验收标准：H-10 通过；选择→上传成功；取消无错误提示；>限制大小给出替代路径。

- [ ] **6.8 鸿蒙文件导出与系统分享桥**
  - 级别：必须
  - 涉及文件：`bridge/ShareBridge.ets`（新建）
  - 改动/产出：`file.export` 使用 `DocumentViewPicker.save()` + `fs` 写入；`share.open` 调系统分享；失败降级为复制链接/在线预览；不静默失败。
  - 前置依赖：6.5
  - 验收标准：H-11 通过；导出文件可在文件 App 找到；分享面板可拉起；失败路径有明确提示。

- [ ] **6.9 通知、剪贴板、网络状态、外部打开桥**
  - 级别：必须
  - 涉及文件：`bridge/SystemBridge.ets`（新建）
  - 改动/产出：NotificationKit 权限与本地通知；pasteboard 读写；NetworkKit 默认网络与变化订阅（去重）；`external.openUrl/openFile`；拒绝权限引导设置，不重复弹窗。
  - 前置依赖：6.5
  - 验收标准：H-12 通过；网络切换只收到一次事件；剪贴板隐私场景降级；外部打开合法 URL。

- [ ] **6.10 生命周期与前后台流式策略**
  - 级别：必须
  - 涉及文件：`EntryAbility.ets`、`bridge/LifecycleBridge.ets`（新建）、`harmony_bridge.ts`
  - 改动/产出：`onForeground/onBackground` 派发到页面；后台通知页面暂停流式并释放连接；回前台先对账再允许发送；禁止依赖后台长连接保活。
  - 前置依赖：6.5
  - 验收标准：H-15 通过；后台 5 分钟返回不重复消息；未对账时发送被禁用；连接状态正确恢复。

- [x] **6.11 权限最小化与用途声明**
  - 级别：必须
  - 涉及文件：`harmony/entry/src/main/module.json5`、`entry/src/main/resources/base/element/string.json`
  - 改动/产出：INTERNET 必需；GET_NETWORK_INFO 用于网络状态；CAMERA 仅扫码时申请；通知运行时申请；移除无关权限；每项有用户可读用途说明。
  - 前置依赖：6.1
  - 验收标准：H-05 通过；权限清单逐项对应能力；拒绝任一可选权限后主流程可用；无孤立权限。

- [x] **6.12 明文与网络传输策略**
  - 级别：必须
  - 涉及文件：`harmony/entry/src/main/resources/base/profile/network_config.json`
  - 改动/产出：基线禁止明文；回环/局域网按需声明；公网仅 HTTPS；容器 `MixedMode` 与网络配置联动；记录鸿蒙对动态内网 IP 的限制与补偿方案；禁止全局放开任意明文域名。
  - 前置依赖：6.1
  - 验收标准：H-06 通过；公网 `http://` 被阻断并提示；局域网经确认可连；发布检查记录策略。

- [x] **6.13 深链**
  - 级别：建议
  - 涉及文件：`module.json5`（skills）、`EntryAbility.onNewWant`、`bridge/DeeplinkBridge.ets`（新建）
  - 改动/产出：`dsh://` 打开连接页/指定会话；参数只允许连接标识/配对码引用；含凭据或未知目标拒绝并审计。
  - 前置依赖：6.1
  - 验收标准：H-19 通过；合法深链直达；非法链接回首页并提示。

- [x] **6.14 诊断导出**
  - 级别：必须
  - 涉及文件：`bridge/DiagnosticsBridge.ets`（新建）
  - 改动/产出：导出宿主类型、系统版本、容器内核版本、壳版本、产物哈希、桥版本、最近错误码；脱敏（无凭据/对话正文/完整配对码）；不可导出时展示可复制摘要。
  - 前置依赖：6.5
  - 验收标准：H-18 通过；五项信息齐全；脱敏检查 0 命中；文件可读。

- [ ] **6.15 鸿蒙真机闭环与附录 F 预验收**
  - 级别：必须
  - 涉及文件：`docs/specs/mobile_app_evolution/test_records/harmony.md`（新建）
  - 改动/产出：局域网 + HTTPS 各完成"连接—对话—审批"；流式不可用时验证对账；键盘/安全区/返回键/深色/字体缩放；白屏恢复；禁止远程代码。
  - 前置依赖：6.3–6.14
  - 验收标准：H-13/H-14/H-16/H-17/H-20 通过；六项实测结论与 3.8 一致；无阻断项。

---

## 7. [M4] iOS Tauri 2 Mobile 壳

> 目标：复用 5.1 的 Rust 壳，补齐 iOS 安全存储、ATS、文件与 TestFlight。

- [ ] **7.1 初始化 iOS 工程**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/src-tauri/gen/apple/`（生成）
  - 改动/产出：`tauri ios init`；最低 iOS 15.0；Bundle Identifier 与 Android 对齐；签名团队配置。
  - 前置依赖：5.1
  - 验收标准：`tauri ios build --debug` 通过；模拟器/真机可启动并加载 `h5-dist`。

- [ ] **7.2 ATS 与本地网络权限**
  - 级别：必须
  - 涉及文件：`gen/apple/**/Info.plist`
  - 改动/产出：使用 `NSAllowsLocalNetworking=true` 允许局域网明文；**不使用** `NSAllowsArbitraryLoads=true`；`NSLocalNetworkUsageDescription` 说明用途；如需 Bonjour 声明 `NSBonjourServices`；公网仅 HTTPS。
  - 前置依赖：7.1
  - 验收标准：局域网 `http://` 可连；公网 `http://` 被 ATS 阻断；审核说明可解释本地网络用途。

- [ ] **7.3 iOS Keychain 凭据插件**
  - 级别：必须
  - 涉及文件：`src-tauri/plugins/credential_ios/`（新建，Swift）、`src/platform/impl/tauri_credential.ts`
  - 改动/产出：Keychain 保存/读取/删除/存在性；只暴露引用；`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` 级别；卸载重装不可恢复。
  - 前置依赖：5.3
  - 验收标准：四项操作正确；日志/文件无明文；重装后需重新配对。

- [ ] **7.4 iOS 文件选择、导出与分享**
  - 级别：必须
  - 涉及文件：`credential_ios` 同级 `file_ios`（新建，Swift）、`src/platform/impl/tauri_file.ts`
  - 改动/产出：`UIDocumentPickerViewController` 选择；`UIDocumentPickerViewController(forExporting:)` 导出；`UIActivityViewController` 分享；取消返回 `CANCELLED`；宿主令牌。
  - 前置依赖：5.3
  - 验收标准：选择→上传、导出→分享成功；取消无错误；大文件降级。

- [ ] **7.5 iOS 通知、深链、生命周期**
  - 级别：必须
  - 涉及文件：`file_ios` 同级 `system_ios`（新建，Swift）、`gen/apple/**/Info.plist`（`CFBundleURLTypes`）
  - 改动/产出：`UNUserNotificationCenter` 权限与本地通知；`dsh://` scheme / Universal Link（二选一，优先 scheme）；前后台事件去重；版本读取。
  - 前置依赖：5.3
  - 验收标准：通知授权/拒绝两态；深链直达连接页；前后台事件各一次；版本正确。

- [ ] **7.6 TestFlight 签名与构建**
  - 级别：必须
  - 涉及文件：`gen/apple` 签名配置、`.github/workflows/ios_build.yml`（新建）、CI secrets
  - 改动/产出：archive + 导出 IPA；版本号与构建号；TestFlight 内部测试组；不打包 Agent。
  - 前置依赖：7.2
  - 验收标准：archive 成功；IPA ≤45MB；TestFlight 可安装；审核隐私说明齐全。

- [ ] **7.7 iOS 真机/TestFlight 闭环**
  - 级别：必须
  - 涉及文件：`docs/specs/mobile_app_evolution/test_records/ios.md`（新建）
  - 改动/产出：连接—对话—流式—审批—文件/分享—通知；Keychain 持久化；ATS 策略；后台恢复。
  - 前置依赖：7.3–7.6
  - 验收标准：TestFlight 安装后全链路通过；无明文凭据；无 ATS 误拦截。

---

## 8. [M2–M4] 连接、配对与凭据（跨端）

> 目标：补齐服务端缺失的设备配对能力，并让三端共用同一连接/状态机/配对流程。

- [x] **8.1 服务端设备配对与吊销接口**
  - 级别：必须
  - 涉及文件：`dsh-java-api/src/main/java/net/linlan/dsh/api/IDeviceApi.java`（新建）、`dto/DevicePairing*.java`（新建）、`dsh-java-case/.../cases/device/DevicePairingUseCase.java`（新建）、`dsh-java-domain/.../domain/device/**`（新建）、`dsh-java-infrastructure/.../device/DeviceCredentialRepository.java`（新建）、`dsh-java-trigger/.../trigger/http/DeviceController.java`（新建）
  - 改动/产出：建议接口 `POST /api/devices/pairing-codes`（桌面生成，10 分钟一次性）、`POST /api/devices/pair`（移动提交，签发设备凭据）、`GET /api/devices`、`DELETE /api/devices/{device_id}`、`POST /api/devices/{device_id}/rotate`；配对码限流；设备标识服务端签发；路径最终以设计确认为准。
  - 前置依赖：无（可与 M0 并行）
  - 验收标准：配对 ≤60 秒；配对码一次性且 10 分钟过期；单设备吊销不影响其他设备；暴力尝试被限流；接口返回统一信封。

- [x] **8.2 设备凭据签发、指纹与轮换**
  - 级别：必须
  - 涉及文件：`ApiKeyAuthInterceptor.java`、`DeviceCredentialService.java`（新建）、`harness.auth.*` 配置
  - 改动/产出：设备级 Bearer Token；保存指纹不保存明文；与既有 `X-API-Key` 并存；吊销后 401；轮换后旧 token 失效、新 token 生效；每设备独立凭据。
  - 前置依赖：8.1
  - 验收标准：吊销→下次请求 401 且本地清理；轮换→重新配对或刷新恢复；不存在多设备共用主 Key。

- [ ] **8.3 配对 UI：扫码 + 短码双路径**
  - 级别：必须
  - 涉及文件：`src/components/ConnectionSetupView.tsx`（新建）、`src/platform/capabilities.ts`、`src/platform/impl/*_scanner.ts`
  - 改动/产出：扫码与手动短码两条路径；相机权限被拒时仍可手输；配对倒计时；成功后写入安全存储并进入连接页；失败给出明确原因（过期/已使用/时间偏差）。
  - 前置依赖：2.8、8.1、9.4/9.5（扫码实现）
  - 验收标准：相机拒绝→手输完成配对；60 秒内完成；过期/已使用提示准确；配对成功设备出现在列表。

- [x] **8.4 连接配置管理**
  - 级别：必须
  - 涉及文件：`src/components/ConnectionListView.tsx`（新建）、`src/platform/connection_store.ts`（新建）、`src/components/SettingsView.tsx`
  - 改动/产出：新增/编辑/删除/切换；展示通道类型、最近状态、最后使用时间；按配置隔离会话缓存；删除二次确认；不持久化明文凭据。
  - 前置依赖：2.1
  - 验收标准：两个配置切换后会话列表隔离；状态展示正确；删除后缓存清理且不可恢复。

- [x] **8.5 连接状态机与退避**
  - 级别：必须
  - 涉及文件：`src/lib/connection_state.ts`（新建）、`src/components/ConnectionStatus.tsx`（新建）
  - 改动/产出：六态 `UNCONNECTED/CONNECTING/CONNECTED/RECONNECTING/AUTH_FAILED/UNREACHABLE`；连续失败 3 次退避 1s→15s；手动立即重试；断网 5 秒内状态变化；不只显示转圈。
  - 前置依赖：2.5、8.4
  - 验收标准：断网/恢复状态正确；退避曲线可观测；手动重试生效；鉴权失败停止自动重试。

- [x] **8.6 公网 HTTPS 校验与明文阻断**
  - 级别：必须
  - 涉及文件：`src/platform/connection.ts`
  - 改动/产出：公网地址必须 `https://`；回环/局域网明文需用户显式确认；识别"容器混合内容拦截"并提示改用 HTTPS/原生传输，不显示笼统网络错误。
  - 前置依赖：8.4
  - 验收标准：公网 `http://` 保存被阻断；局域网明文有确认步骤；混合内容提示可执行。

- [x] **8.7 单写多读冲突处理**
  - 级别：必须
  - 涉及文件：`src/lib/agent-client.ts`、`ConversationView.tsx`
  - 改动/产出：识别服务端冲突响应；后到方转只读并提示"该会话正在其他设备上运行"；不自动重试、不覆盖；恢复写权限需显式操作。
  - 前置依赖：2.3
  - 验收标准：双端并发提交仅一方成功；另一方进入只读且提示准确；桌面端行为不变。

- [x] **8.8 桌面端"允许移动设备连接"开关**
  - 级别：必须
  - 涉及文件：`dsh-java-desktop/src-tauri/src/lib.rs`、`SettingsView.tsx`、`dsh-java` 监听配置
  - 改动/产出：默认关闭；开启后才对外监听并生成配对码；关闭后已连接设备下次请求被拒；开关状态可观测；强制鉴权。
  - 前置依赖：8.1
  - 验收标准：关闭→手机不可达；开启+配对→恢复；无鉴权时不得监听非回环地址。

- [x] **8.9 旧版 mobile 配置迁移**
  - 级别：建议
  - 涉及文件：`src/platform/migration.ts`（新建）
  - 改动/产出：提供一次性迁移说明；能读取的旧配置转换为新 `ConnectionProfile`；不能读取的引导重新配对；不得静默清除。
  - 前置依赖：8.4
  - 验收标准：迁移前后配置数量可见；失败有说明；无静默数据丢失。

---

## 9. [M2–M4] 原生能力迁移：SSH / Relay / 扫码 / 安全存储

> 目标：把 `legacy/kmp` 的原生能力重写为 Tauri 插件或 ArkTS 桥；**仅参考实现，不复用 Kuikly UI 与 KMP 协议层**。

- [ ] **9.1 SSH 端口转发（Tauri 插件）**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/src-tauri/src/plugins/ssh/`（新建）；参考 `legacy/kmp/androidApp/src/main/java/net/linlan/dsh/ssh/SshTunnelManager.kt`、`legacy/kmp/iosApp/iosApp/KuiklyExpand/Native/DshSshTunnel.m`
  - 改动/产出：优先纯 Rust `russh`（避免 JNI/FFI），必要时回退 `ssh2`；本地端口转发；目标 host/port 可配；断开释放端口；后台释放策略。
  - 前置依赖：5.3
  - 验收标准：SSH 连接远端 Agent 完成对话；重复连接不占端口；断网释放；无明文私钥日志。

- [ ] **9.2 SSH 凭据与 host key 校验**
  - 级别：必须
  - 涉及文件：`plugins/ssh/known_hosts.rs`（新建）、`src/platform/impl/tauri_ssh.ts`（新建）
  - 改动/产出：私钥存安全存储；host key TOFU 校验；首次确认与变更告警；禁止把私钥写入配置/日志。
  - 前置依赖：9.1、5.7
  - 验收标准：错误 host key 拒绝连接；首次连接有确认；私钥文件扫描 0 命中。

- [ ] **9.3 Relay 客户端（Tauri 插件，待决策）**
  - 级别：建议
  - 涉及文件：`plugins/relay/`（新建）；参考 `legacy/kmp/androidApp/.../relay/DshRelayManager.kt`、`legacy/kmp/iosApp/.../DshRelayRuntime.swift`、`legacy/kmp/ohosApp/.../native/DshRelayLoopback.ets`
  - 改动/产出：先完成 spec 7.2 第 10 项 决策（是否为 dsh-java 新建中继）；若做，实现 loopback server + 中继协议；若不做，连接页隐藏 Relay 入口并给出 SSH/HTTPS 替代。
  - 前置依赖：5.3、spec 7.2 第 10 项 决策
  - 验收标准：Relay 通道完成对话，或明确登记"首版不提供"且无死入口。

- [ ] **9.4 Android/iOS 扫码**
  - 级别：必须
  - 涉及文件：`src-tauri/gen/android/.../ScanPlugin.kt`（新建）、`credential_ios` 同级 `scan_ios`（新建）、`src/platform/impl/tauri_scanner.ts`（新建）
  - 改动/产出：CameraX/MLKit（Android）、AVFoundation（iOS）；返回配对码；权限拒绝回传 `DENIED` 并保留手输。
  - 前置依赖：5.3、8.3
  - 验收标准：扫码成功率高；权限拒绝可手输；取消返回 `CANCELLED`。

- [ ] **9.5 鸿蒙扫码**
  - 级别：必须
  - 涉及文件：`harmony/entry/src/main/ets/bridge/ScanBridge.ets`（新建）；参考 `legacy/kmp/ohosApp/.../native/DshQrScan.ets`
  - 改动/产出：CameraKit 扫码；权限仅扫码时申请；拒绝后手输可用；结果回传页面。
  - 前置依赖：6.5、8.3
  - 验收标准：扫码→配对成功；拒绝相机→手输成功；无权限时不崩溃。

- [ ] **9.6 鸿蒙 SSH（待决策）**
  - 级别：可选
  - 涉及文件：`harmony/entry/src/main/ets/native/DshSshTunnel.ets`（新建）；参考 `legacy/kmp/ohosApp/.../native/DshSshKeyStore.ets`
  - 改动/产出：若 spec 7.2 第 16 项 决定首版提供，则实现端口转发与密钥存储；否则连接页隐藏 SSH 入口。
  - 前置依赖：6.5、spec 7.2 第 16 项 决策
  - 验收标准：提供则 SSH 闭环；不提供则无不可用入口、无未处理异常。

- [ ] **9.7 鸿蒙 Relay（待决策）**
  - 级别：可选
  - 涉及文件：`harmony/entry/src/main/ets/native/DshRelayRuntime.ets`（新建）
  - 改动/产出：同 9.3，按决策实现或隐藏入口。
  - 前置依赖：6.5、spec 7.2 第 10 项、spec 7.2 第 16 项
  - 验收标准：提供则 Relay 闭环；不提供则无死入口。

- [ ] **9.8 三端安全存储一致性测试**
  - 级别：必须
  - 涉及文件：`tests/security/credential_matrix.md`（新建）
  - 改动/产出：Android/iOS/HarmonyOS 分别验证保存/读取/删除/存在性；卸载/清数据后不可恢复；日志/沙箱/Web 存储扫描无明文。
  - 前置依赖：5.7、6.6、7.3
  - 验收标准：三端结果一致；无明文落盘；清除后必须重新配对。

- [x] **9.9 legacy 参考映射与冻结边界说明**
  - 级别：必须
  - 涉及文件：`docs/specs/mobile_app_evolution/legacy_mapping.md`（新建）
  - 改动/产出：逐项列出"能力 → legacy 文件 → 新实现 → 复用程度 → 不复用原因"；明确 Kuikly 页面、KMP 协议层不复用；说明 `legacy/kmp` 不参与构建。
  - 前置依赖：无
  - 验收标准：SSH/Relay/安全存储/扫码四项均有映射；UI 复用为"无"；构建配置无 legacy 引用。

---

## 10. [M5] 工程基建与文档

> 目标：仓库可被新人按文档构建；CI 覆盖五目标；版本/能力矩阵单一来源。

- [x] **10.1 重写 README**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/README.md`
  - 改动/产出：说明新架构（Tauri 2 Mobile Android/iOS + ArkTS/ArkWeb 鸿蒙 + 同一份 H5）、仓库边界（UI 在 desktop）、构建命令、产物注入、目录结构、发布流程、legacy 冻结说明；删除 KMP/Kuikly 主线描述。
  - 前置依赖：无
  - 验收标准：按 README 可从零构建 H5/Android/iOS/鸿蒙；无过时命令；无"内嵌 Node/Harness"描述。

- [x] **10.2 按 React/Tauri 重建 `.gitignore`**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/.gitignore`
  - 改动/产出：忽略 `node_modules/`、`dist/`、`h5-dist/`、`src-tauri/target/`、`gen/android/.gradle`、`gen/apple/Pods`、`harmony/build`、`.hvigor`、`oh_modules`、keystore/properties、`.env`；保留 `legacy/kmp` 跟踪策略（如仍跟踪）。
  - 前置依赖：无
  - 验收标准：构建后 `git status` 无产物；敏感文件不入库；`legacy/kmp` 状态明确。

- [x] **10.3 CI：H5 构建、测试、哈希与制品**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/.github/workflows/h5_build.yml`（新建）
  - 改动/产出：checkout desktop + mobile；`npm ci`；`npm run build`；`npm test`；`check:boundary`；产物扫描/体积/安全；上传 `dist` + `artifact_meta.json`；只构建一次。
  - 前置依赖：3.2
  - 验收标准：流水线绿灯；制品可被下游下载；失败原因可见；无第二次前端构建。

- [x] **10.4 CI：契约测试**
  - 级别：必须
  - 涉及文件：`.github/workflows/contract_test.yml`（新建）
  - 改动/产出：检出 dsh-java 以获取 fixtures；运行五端参数化契约测试；fixtures 缺失显式失败。
  - 前置依赖：2.7
  - 验收标准：7 份 fixtures 全绿；缺 fixtures 时失败而非 skip；报告可下载。

- [ ] **10.5 CI：Android 构建**
  - 级别：必须
  - 涉及文件：`.github/workflows/android_build.yml`（新建）
  - 改动/产出：JDK 17 + Android SDK + Rust；下载 H5 制品；`tauri android build`；产出 APK/AAB；签名 secrets；包体检查。
  - 前置依赖：5.12
  - 验收标准：APK 与 AAB 均产出；≤30MB；签名有效。

- [ ] **10.6 CI：iOS 构建**
  - 级别：必须
  - 涉及文件：`.github/workflows/ios_build.yml`（新建）
  - 改动/产出：macOS runner；Xcode；下载 H5 制品；archive；TestFlight 上传（可选手动触发）。
  - 前置依赖：7.6
  - 验收标准：archive 成功；IPA ≤45MB；上传可手动触发。

- [ ] **10.7 CI：HarmonyOS 构建**
  - 级别：必须
  - 涉及文件：`.github/workflows/harmony_build.yml`（新建）
  - 改动/产出：DevEco/hvigor 构建 HAP；下载 H5 制品到 `rawfile/h5/`；签名 profile；产物归档；如托管 runner 不支持则使用自托管 runner 并文档化。
  - 前置依赖：6.1
  - 验收标准：HAP 产出；≤40MB；签名有效；构建步骤可复现。

- [x] **10.8 能力裁剪矩阵（单一来源）**
  - 级别：必须
  - 涉及文件：`docs/specs/mobile_app_evolution/capability_matrix.md`（新建）
  - 改动/产出：14 能力域 × desktop/Android/iOS/HarmonyOS/小程序 × `FULL/DEGRADED/NONE`；补降级说明、最低支持版本、依赖桥版本；与附录 D 逐项对齐；功能级矩阵同步。
  - 前置依赖：2.8
  - 验收标准：无空值；与附录 D 一致；新增能力必须同步更新（写入评审检查单）。

- [x] **10.9 多端版本矩阵**
  - 级别：必须
  - 涉及文件：`docs/specs/mobile_app_evolution/version_matrix.md`（新建）
  - 改动/产出：端类型、版本号、契约版本、兼容范围、发布时间、状态（CURRENT/SUPPORTED/DEPRECATED/BLOCKED）；覆盖当前版/前一版/最低支持版；小程序单独维护基础库。
  - 前置依赖：10.8
  - 验收标准：任一新版本可查兼容组合；服务端先行时间可追溯；与发布说明一致。

- [x] **10.10 legacy 冻结边界与构建隔离**
  - 级别：必须
  - 涉及文件：`dsh-java-mobile/legacy/kmp/README.md`（新建）、根 `README.md`、CI 配置
  - 改动/产出：声明冻结、不参与构建、不接受新功能；CI 不引用 legacy；如彻底删除需单独评审。
  - 前置依赖：无
  - 验收标准：构建日志无 legacy 路径；`grep -rn "legacy/kmp" --include="*.json" --include="*.yml" --include="*.kts"` 无构建引用。

- [x] **10.11 诊断与日志规范**
  - 级别：必须
  - 涉及文件：`docs/specs/mobile_app_evolution/diagnostics_spec.md`（新建）、`src/platform/diagnostics.ts`（新建）
  - 改动/产出：诊断必备五项（宿主、壳版本、产物哈希、桥版本、内核版本）；脱敏字段（API Key、模型密钥、SSH 私钥、完整配对码、对话正文）；导出格式与错误码表；五类关键链路独立标识（连接/配对/流式/审批/文件）。
  - 前置依赖：2.9
  - 验收标准：三端导出样例通过脱敏检查；五项齐全；错误码可定位。

---

## 11. [M5] 验证与发布

> 目标：发布前证明"同一产物、三端可用、可回滚、可审核"。

- [x] **11.1 契约回归（五端）**
  - 级别：必须
  - 涉及文件：`docs/specs/mobile_app_evolution/test_records/contract.md`（新建）
  - 改动/产出：7 份 fixtures、11 个事件名、8 类错误映射、`seq` 去重/缺口补拉；记录五端结果。
  - 前置依赖：2.7
  - 验收标准：全绿；无宿主专属协议分支；报告归档。

- [ ] **11.2 三端构建与产物哈希一致性**
  - 级别：必须
  - 涉及文件：`scripts/verify_artifact_consistency.mjs`（新建）、`test_records/artifact_consistency.md`（新建）
  - 改动/产出：解包 APK/AAB、IPA、HAP，读取 `artifact_meta.json`，比对 `content_hash` 与文件清单；允许壳版本不同，不允许产物不同。
  - 前置依赖：3.2、5.12、6.1、7.6
  - 验收标准：四端（含 desktop）哈希一致；不一致时脚本非 0 退出；发布流水线阻断。

- [ ] **11.3 鸿蒙六项复测与证据归档**
  - 级别：必须
  - 涉及文件：`test_records/harmony_container.md`（新建）
  - 改动/产出：发布前复测 POST SSE、文件上传、Blob 下载、rawfile/自定义 scheme、DOM 存储、混合内容；记录设备/系统/内核版本与结论。
  - 前置依赖：6.3、6.7、6.8
  - 验收标准：六项均有结论；与 3.8 差异有解释；阻断项为 0。

- [ ] **11.4 附录 F 全项验收（H-01–H-20）**
  - 级别：必须
  - 涉及文件：`test_records/harmony_checklist.md`（新建）
  - 改动/产出：逐项执行并记录"通过/已知限制/阻断"；阻断必须为 0；已知限制写入发布说明。
  - 前置依赖：6.15
  - 验收标准：20 项全部有结论；证据可追溯；无阻断。

- [ ] **11.5 性能与包体验收**
  - 级别：必须
  - 涉及文件：`test_records/performance.md`（新建）
  - 改动/产出：冷启动 ≤2.5s（鸿蒙 ≤3.0s）；首字节劣化 ≤20%；会话首屏 ≤800ms；APK ≤30MB、IPA ≤45MB、HAP ≤40MB；前台内存 ≤300MB；后台 5 分钟释放连接。
  - 前置依赖：11.2
  - 验收标准：五项指标有实测值与机型；超标项有整改记录；后台释放可观测。

- [x] **11.6 安全验收（凭据、明文、桥、脱敏）**
  - 级别：必须
  - 涉及文件：`test_records/security.md`（新建）
  - 改动/产出：三端安全存储扫描；公网明文阻断；鸿蒙桥白名单/版本/审计；深链非法参数拒绝；诊断导出脱敏；H5 产物无凭据/远程代码。
  - 前置依赖：11.4、9.8
  - 验收标准：6 类检查全部通过；日志/文件/URL/Web 存储无凭据明文；未声明桥方法被拒并留审计。

- [x] **11.7 商店合规与隐私物料**
  - 级别：必须
  - 涉及文件：`docs/release/privacy_policy.md`（新建）、`docs/release/store_notes.md`（新建）
  - 改动/产出：Google Play / App Store / AGC 的权限用途说明、隐私政策、数据安全表单；说明"界面代码随包、仅数据远程、无远程脚本/热更新"；iOS 本地网络与 ATS 说明。
  - 前置依赖：11.4
  - 验收标准：三端审核材料齐备；权限与能力矩阵一致；无"隐藏功能绕过审核"描述。

- [x] **11.8 发布检查单、灰度与回滚**
  - 级别：必须
  - 涉及文件：`docs/release/release_checklist.md`（新建）、`docs/release/rollback.md`（新建）
  - 改动/产出：发布前检查单（产物哈希、契约、能力矩阵、诊断、商店物料）；远程功能开关；灰度比例；回滚步骤与责任人；服务端先行时间线。
  - 前置依赖：11.5、11.7
  - 验收标准：检查单全项有结论；关闭开关后入口同步隐藏；回滚演练成功；发布记录含产物哈希。

- [x] **11.9 已知限制与发布说明**
  - 级别：必须
  - 涉及文件：`docs/release/release_notes_template.md`（新建）
  - 改动/产出：逐项列出新增/降级/移除功能；鸿蒙 SSH/Relay 是否提供；Android 动态内网明文限制；iOS ATS 限制；与能力矩阵一致。
  - 前置依赖：11.8
  - 验收标准：发布说明与能力矩阵逐项一致；已知限制可被用户理解；无静默强制升级。

- [x] **11.10 桌面端回归**
  - 级别：必须
  - 涉及文件：`test_records/desktop_regression.md`（新建）
  - 改动/产出：快捷键、右键菜单、拖拽、窗口行为、Agent 托管、自动更新、文件预览、Git 功能全部回归；确认适配层改造未降级桌面。
  - 前置依赖：1.10、4.2
  - 验收标准：桌面既有用例全通过；无新增未捕获异常；启动/更新可用。

---

## 12. [可选] 小程序（轻量入口）

> 目标：复用协议 SDK 与模型，UI 轻量重写；不阻塞三端 App 发布。

- [x] **12.1 Taro 工程与协议 SDK 复用**
  - 级别：可选
  - 涉及文件：`dsh-java-mini/`（新建，独立工程）、`src/lib/protocol.ts` 的跨包引用方案
  - 改动/产出：Taro（React 语法）；复用请求路径、信封、事件解析、模型；不复制协议封装；UI 仅覆盖会话列表/消息/文本发送/简版审批。
  - 前置依赖：2.2
  - 验收标准：接口调用代码与 App 同源；事件名一致；核心流程真机预览通过。

- [ ] **12.2 域名白名单、登录态与订阅消息**
  - 级别：可选
  - 涉及文件：`dsh-java-mini/src/platform/*`、小程序后台配置
  - 改动/产出：所有请求域名在白名单；平台登录态换短期令牌/服务端代理；不使用长期主凭据；完成/审批订阅消息。
  - 前置依赖：12.1、8.2
  - 验收标准：真机无"域名不在白名单"；登录失效可恢复且不丢草稿；订阅消息可收到。

- [x] **12.3 包体门禁与能力降级**
  - 级别：可选
  - 涉及文件：`dsh-java-mini/scripts/check_size.mjs`（新建）
  - 改动/产出：主包 ≤2MB、总包 ≤20MB；文件/Git/插件/数字人编排隐藏入口并引导到 App；提供"在 App 中打开"。
  - 前置依赖：12.1
  - 验收标准：体积检查通过；受限能力有替代路径；无死路。

---

## 附录 A：legacy/kmp 参考映射（仅参考，不复用 UI）

| 能力 | legacy 参考文件 | 新实现位置 | 复用程度 | 说明 |
| --- | --- | --- | --- | --- |
| SSH 隧道（Android） | `legacy/kmp/androidApp/src/main/java/net/linlan/dsh/ssh/SshTunnelManager.kt`、`DshSshForegroundService.kt` | `dsh-java-mobile/src-tauri/src/plugins/ssh/` | 行为参考 | 重写为 Rust 插件；不复用 Kotlin 服务 |
| SSH 隧道（iOS） | `legacy/kmp/iosApp/iosApp/KuiklyExpand/Native/DshSshTunnel.m` | 同上 | 行为参考 | 重写为 Rust 插件；不复用 ObjC |
| SSH 密钥存储 | `legacy/kmp/androidApp/.../ssh/DshSshKeyStore.kt`、`legacy/kmp/iosApp/.../DshSshKeyStore.swift`、`legacy/kmp/ohosApp/.../native/DshSshKeyStore.ets` | 三端安全存储（5.7/6.6/7.3） | 接口参考 | 统一为 `credential.*`，仅存引用 |
| Relay（Android） | `legacy/kmp/androidApp/.../relay/DshRelayManager.kt`、`DshRelayLoopbackServer.kt`、`DshRelaySecrets.kt` | `dsh-java-mobile/src-tauri/src/plugins/relay/`（9.3） | 行为参考 | 待 spec 7.2 第 10 项 决策；不复用 Kotlin |
| Relay（iOS） | `legacy/kmp/iosApp/.../DshRelayRuntime.swift`、`DshRelayLoopback.swift`、`DshRelaySecrets.swift` | 同上 | 行为参考 | 不复用 Swift |
| Relay（鸿蒙） | `legacy/kmp/ohosApp/.../native/DshRelayRuntime.ets`、`DshRelayLoopback.ets` | `harmony/.../native/DshRelayRuntime.ets`（9.7） | 行为参考 | 待 spec 7.2 第 16 项 决策 |
| 扫码（Android） | `legacy/kmp/androidApp/.../relay/DshQrScanActivity.kt`、`DshQrScanOverlayView.kt` | `ScanPlugin.kt`（9.4） | 交互参考 | 改用 CameraX/MLKit |
| 扫码（iOS） | `legacy/kmp/iosApp/.../DshQrScanViewController.swift` | `scan_ios`（9.4） | 交互参考 | 改用 AVFoundation |
| 扫码（鸿蒙） | `legacy/kmp/ohosApp/.../native/DshQrScan.ets` | `ScanBridge.ets`（9.5） | 交互参考 | 改用 CameraKit |
| 安全存储 | `legacy/kmp/shared/src/*/DshLocalStore.*`、`DshHostStoreTest.kt` | `credential.*` 三端实现 | 接口参考 | 不复用 KMP 存储层；凭据只存引用 |
| 协议层（Ktor SSE/WS） | `legacy/kmp/shared/src/sseMain` | `dsh-java-desktop/src/lib/protocol.ts` | 行为参考 | 协议单一事实源改为 TS SDK |
| Kuikly 页面栈 | `legacy/kmp/shared/src/commonMain` | 无 | **不复用** | 冻结；UI 来自同一份 React H5 |
| 鸿蒙壳入口 | `legacy/kmp/ohosApp/entry/src/main/ets/pages/Index.ets` | `harmony/entry/src/main/ets/pages/Index.ets` | 结构参考 | 由 Kuikly 容器改为 ArkWeb 容器 |
| 鸿蒙权限/明文 | `legacy/kmp/ohosApp/entry/src/main/module.json5`、`network_config.json` | `harmony/entry/src/main/module.json5`、`network_config.json` | 改造参考 | 权限最小化、明文收紧 |
| Android 明文 | `legacy/kmp/androidApp/src/main/res/xml/network_security_config.xml` | `gen/android/app/src/main/res/xml/network_security_config.xml` | 改造参考 | 公网仅 HTTPS |
| iOS ATS | `legacy/kmp/iosApp/iosApp/Info.plist` | `gen/apple/**/Info.plist` | 改造参考 | 移除 `NSAllowsArbitraryLoads`，改用 `NSAllowsLocalNetworking` |
| 旧 CI | `legacy/kmp/.github/workflows/contract-test.yml`、`release.yml` | `.github/workflows/*.yml`（10.3–10.7） | 流程参考 | 按 React/Tauri/鸿蒙重建 |

## 附录 B：待决策项对任务的阻塞关系

| 待决策项（spec 7.2） | 影响任务 | 默认处理 | 未决时是否阻塞 |
| --- | --- | --- | --- |
| 1/2 Agent 承载主路径与"移动端无本地 Agent" | 8.4、8.8 | 首版支持"桌面近场 + 云侧 HTTPS"，不内嵌 | 否（按默认执行） |
| 3 小程序功能边界 | 12.x | 轻量查看 + 文本追问 + 简版审批 | 否（可选） |
| 4 Kuikly/KMP 处置细节 | 9.9、10.10 | 已冻结，仅参考 | 否 |
| 5 桌面对外开放策略 | 8.8 | 默认关闭，显式开启，强制鉴权 | 否 |
| 6 公网部署形态 | 8.6、11.7 | 首版要求 HTTPS 反向代理；不承诺多租户 | 否 |
| 7 商店合规 | 11.7 | 按三端隐私材料准备 | 否 |
| 8 鉴权终态 | 8.2 | 首版设备级 Bearer + 保留 X-API-Key | 否 |
| 9 版本联动责任 | 10.9、11.8 | 服务端先行，客户端滞后 | 否 |
| 10 Relay 是否新建 | 9.3、9.7 | 首版不提供，隐藏入口 | 否（建议项） |
| 11 文件能力范围 | 5.8、6.8、7.4 | 选择/导出/分享全做，目录树降级 | 否 |
| 12 鸿蒙六项实测 | 3.8、11.3 | 必须先测；阻断则先出降级方案 | **是（M3 准入）** |
| 13 JSBridge 方案 | 6.5 | 单命名空间 + 异步回调 + 白名单 | 否（已按 spec 约束定） |
| 14 H5 分发模式 | 3.6 | 默认内嵌；托管为可选 | 否 |
| 15 产物基址方案 | 1.1–1.3 | 构建基址改相对路径 | 否（已定） |
| 16 鸿蒙 SSH/Relay 首版 | 9.6、9.7 | 不提供，隐藏入口 | 否 |
| 17 鸿蒙签名与发布 | 6.1、10.7、11.7 | 沿用 `net.linlan.dsh`，AGC 后置 | 否 |
| 18 Tauri 传输与混合内容 | 5.6、5.11、7.2 | 原生 fetch 优先，plugin-http 回退 | 否 |
| 19 壳与 H5 更新关系 | 3.6、11.8 | 整包更新；不做 H5 独立热更 | 否 |

## 附录 C：风险与前置缓解

| 风险 | 触发点 | 缓解任务 |
| --- | --- | --- |
| 产物绝对路径导致鸿蒙首屏 404 | 1.1–1.3 | 相对基址 + 子路径验证 + 扫描门禁 |
| 纯 H5 被 Tauri 依赖拖死 | 1.10–1.12 | 适配层下沉 + 静态门禁 + 浏览器 smoke |
| ArkWeb 不支持 POST SSE / 文件选择 | 3.8 | 先实测；不支持则对账/原生选择器降级 |
| 鸿蒙 rawfile 相对路径不解析 | 6.3 | `onInterceptRequest` 映射或同源托管，不改产物 |
| iOS ATS 阻断局域网 | 7.2 | `NSAllowsLocalNetworking`，不使用任意放开 |
| Android 动态内网 IP 无法预声明 | 5.11 | 应用层校验 + 用户确认 + scope 限制，登记已知限制 |
| 产物体积超 4MB | 3.3 | echarts/xlsx/mammoth 按需加载/裁剪 |
| 窄屏返工 | 4.2–4.4 | 先做 360px 闭环，再进壳 |
| 服务端无配对接口 | 8.1 | M0 期间并行开发，M2 前完成 |
| 双 UI 栈复活 | 2.2、10.10 | 仓库边界 + 构建引用检查 + 评审门禁 |
| Tauri Mobile 成熟度 | 5.x/7.x | 关键插件先做 spike；阻断时按 spec 走 Capacitor 变更流程 |

## 附录 D：任务统计

| 维度 | 数量 |
| --- | --- |
| 主任务 | 12 |
| 子任务 | 116 |
| 任务总数（主 + 子） | 128 |
| 必须 | 102 |
| 建议 | 8 |
| 可选 | 6 |

> 统计口径：以 `- [ ] **x.y` 为子任务；以 `## n.` 为主任务；级别取每个子任务 `级别：` 字段。发布前由脚本复核，避免人工统计漂移。
