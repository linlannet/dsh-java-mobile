# DSH Java Mobile v0.2.0 编码任务清单

> 版本：`v0.2.0` | 基线：`v0.1.0` | 架构：多端壳工程（Tauri 2 Mobile / ArkTS + ArkWeb / Taro 4），不承载 React 业务源码
>
> 本清单把 `docs/0.2.0/spec.md` 的 **§5.1–§5.9 九大能力领域**、**§4 DFX**、**§6 数据约束** 与 `docs/0.2.0/design.md` 的分层落位转化为可执行、可验收的编码任务；完整逐条依据为 `docs/specs/mobile_app_evolution/tasks.md`。
>
> **范围边界（强制）**：
> 1. 不新增 Maven 模块、不内嵌 JRE/JAR、不新增第二个 React 业务入口。
> 2. 不改 `contractVersion=1` 契约语义；不改桌面端协议 SDK；不改 Android/iOS 共享壳的插件集合语义。
> 3. 移动端不注册 `start_agent` / `stop_agent` / `agent_status` 与 Git 五件套命令。
> 4. 不启用远程脚本、热更新与静默更新。
> 5. 产物源只来自 `../dsh-java-desktop/dist`，不得手工修改 `h5-dist/` 与 `rawfile/h5/`。
>
> **执行顺序与依赖主线**：`1 产物基址 → 2 共享层与契约 → 3 产物流水线 → 4 移动布局 → 5 Android 壳 / 6 鸿蒙壳 / 7 iOS 壳（可并行，依赖工具链）→ 8 连接配对 → 9 原生能力 → 10 工程基建 → 11 验证发布 → 12 小程序 → 13 版本收口`。
>
> **任务统计**：
>
> | 维度 | 数量 |
> | --- | --- |
> | 总清单主任务 | 12 |
> | 总清单子任务 | 116 |
> | 本版本新增收口子任务（第 13 组） | 8 |
> | 可勾选条目合计 | 124 |
> | 必须 | 107（总清单 102 + 收口 5） |
> | 建议 | 10（总清单 8 + 收口 2） |
> | 可选 | 7（总清单 6 + 收口 1） |
> | 已完成（`[x]`） | 72 |
> | 待办（`[ ]`） | 52（总清单 44 + 收口 8） |
>
> **完成状态图例**：`[x]` 已完成 ｜ `[ ]` 待办/受工具链阻塞。
>
> **级别口径**：必须 = 发布阻断；建议 = 应做；可选 = 后续。

---

## 1. 产物基址与纯 H5 可运行（P0 阻塞）

> 依赖：无 ｜ 覆盖：spec §5.1/§5.2、§4.5.4、design §1.1/§1.2 ｜ 完成状态：12/12 完成

- [x] **1.1 Vite 构建基址改为相对路径**；验收：`dist/index.html` 的 script/link 均为 `./assets/...`，任意子目录可加载 —— `../dsh-java-desktop/vite.config.ts`
- [x] **1.2 入口 HTML 资源引用相对化**；验收：`grep -E '(src|href)="/' dist/index.html` 无结果，图标 200 —— `../dsh-java-desktop/index.html`
- [x] **1.3 产物绝对路径与调试残留扫描**；验收：扫描绝对路径/`file://`/sourcemap，违规退出码非 0 —— `scripts/check_h5_artifact.mjs`
- [x] **1.4 定义可注入传输接口 `Transport`**；验收：`request`/`stream`/`cancel` 类型完备，无 `@tauri-apps` 依赖 —— `../dsh-java-desktop/src/platform/transport.ts`
- [x] **1.5 `http.ts` 重构为传输选择层**；验收：浏览器构建不加载 Tauri 实现，桌面回归通过 —— `src/lib/http.ts`、`src/platform/impl/{browser,tauri}_transport.ts`
- [x] **1.6 收敛 `agent-client.ts` 的 5 处裸 `fetch`**；验收：业务调用改走 `Transport`，插件 JAR 分析/上传可用 —— `src/lib/agent-client.ts`
- [x] **1.7 协议入参由 `port` 改为连接对象**；验收：`grep` 无硬编码 `127.0.0.1/8090`，桌面全链路通过 —— `src/lib/agent-client.ts`、`src/App.tsx`
- [x] **1.8 `digital-human-client.ts` 的 Tauri 依赖下沉**；验收：文件内无 `@tauri-apps`，数字人回归通过 —— `src/lib/digital-human-client.ts`
- [x] **1.9 `room-feed.ts` 接入传输接口并复核续传**；验收：断流后不重复、不丢失 —— `src/lib/room-feed.ts`
- [x] **1.10 业务层 `@tauri-apps/*` 全部下沉（13 文件 / 16 处）**；验收：仅 `src/platform/impl/` 命中，`tsc` 通过 —— `src/components/*`、`src/platform/impl/tauri_native.ts`
- [x] **1.11 平台边界静态门禁**；验收：`npm run check:boundary` 0 违规 —— `../dsh-java-desktop/scripts/check_platform_boundary.mjs`
- [x] **1.12 无 Tauri 运行时的纯 H5 闭环验证**；验收：无 `invoke is not a function`，能力探测正确 —— `tests/unit/h5_smoke.test.ts`、`scripts/h5_smoke.mjs`

---

## 2. 共享层与契约

> 依赖：1 ｜ 覆盖：spec §5.3、§6.1、design §1.2.2 ｜ 完成状态：12/12 完成

- [x] **2.1 定义连接配置与连接对象**；验收：8 字段齐全，凭据只存引用 —— `src/platform/connection.ts`、`src/types.ts`
- [x] **2.2 协议 SDK 收敛为单一导出面**；验收：仅一个 React 入口，无 `agent-client.mobile` 副本 —— `src/lib/protocol.ts`
- [x] **2.3 统一信封与错误模型**；验收：401/403/404/500/超时/断网六类映射稳定 —— `src/lib/protocol.ts`、`src/platform/result.ts`
- [x] **2.4 事件模型、`seq` 单调与缺口补拉**；验收：重复/乱序/缺口 fixture 不重复、不回退 —— `src/lib/agent-client.ts`
- [x] **2.5 流式稳定性：超时、看门狗、对账、退避**；验收：120s 静默转对账，退避曲线 1s→15s —— `src/lib/agent-client.ts`
- [x] **2.6 契约 fixtures 单一事实源与 `feishu-bots` 覆盖**；验收：7 份 fixtures 均被引用，缺失即失败 —— `../dsh-java/docs/spec/0.2.2/contract/fixtures/*.json`
- [x] **2.7 契约测试参数化到五端**；验收：desktop/android/ios/harmony/mini 五组通过 —— `tests/unit/contract.test.ts`
- [x] **2.8 平台适配层契约：14 个能力域 / 29 个方法**；验收：逐项对照附录 D 无缺项，`tsc` 通过 —— `src/platform/contract.ts`、`capabilities.ts`
- [x] **2.9 统一返回模型与超时/取消语义**；验收：五类结果可区分，`CANCELLED` 不弹错误 —— `src/platform/result.ts`
- [x] **2.10 能力探测表与桥协议版本协商**；验收：未知方法/版本被拒，缺桥不崩溃 —— `src/platform/capabilities.ts`、`version.ts`
- [x] **2.11 本地存储适配（覆盖 64 处 `localStorage`）**；验收：禁用 DOM 存储不崩溃，仅封装层命中 —— `src/platform/storage.ts`
- [x] **2.12 壳与产物版本兼容校验**；验收：旧壳加载新产物提示升级，诊断含版本 —— `src/platform/version.ts`

---

## 3. 同一份 H5 产物流水线

> 依赖：1、2 ｜ 覆盖：spec §5.2、§6.4、design §2.6 ｜ 完成状态：7/8 完成

- [x] **3.1 产物元数据与内容哈希**；验收：四宿主 `content_hash` 一致，字段齐全 —— `scripts/gen_artifact_meta.mjs`
- [x] **3.2 一次构建、四处投递**；验收：`h5-dist` 与 `rawfile/h5` 哈希一致 —— `scripts/distribute_h5.mjs`
- [x] **3.3 产物体积门禁**；验收：首屏 ≤1MB、完整 ≤4MB（gzip） —— `scripts/check_h5_size.mjs`
- [x] **3.4 远程可执行代码与 `eval` 扫描**；验收：远程脚本/热更新 0 命中 —— `scripts/check_h5_security.mjs`
- [x] **3.5 离线加载与无 CDN 校验**；验收：无外部 CDN 依赖，可离线冷启动 —— `scripts/h5_offline_check.mjs`
- [x] **3.6 内嵌与同源托管产物一致性（可选分发模式）**；验收：托管与内嵌哈希一致 —— `scripts/verify_hosted_hash.mjs`
- [x] **3.7 产物清单文档**；验收：`artifact_manifest.md` 由脚本生成且与元数据一致 —— `scripts/gen_manifest_doc.mjs`
- [ ] **3.8 鸿蒙容器六项可行性实测（M3 准入）**
  - 级别：必须 ｜ 依赖：1.1、3.2 ｜ 文件：`harmony_poc/`（临时）、`docs/specs/mobile_app_evolution/harmony_poc_record.md`
  - 要求：逐项实测 POST SSE 增量读取、`<input type="file">`、Blob/大文件下载、`resource://rawfile` 自定义 scheme、DOM 存储持久化、HTTPS→HTTP 局域网混合内容；每项给出"通过/降级/阻断"+设备型号/系统/内核+证据。
  - 验收：六项均有结论与证据；阻断项有降级方案并通过评审；未通过不得进入 M3 实现。

---

## 4. 窄屏、触控与移动布局（H5 层，三端共用）

> 依赖：1、2 ｜ 覆盖：spec §5.5、§4.1 ｜ 完成状态：7/7 完成

- [x] **4.1 新增 360–430px 断点与移动布局变量**；验收：两档截图无横向滚动 —— `../dsh-java-desktop` 样式
- [x] **4.2 三栏布局改为移动单列 + 抽屉**；验收：360px 下单列可用，抽屉可开关 —— 同上
- [x] **4.3 安全区与键盘避让**；验收：刘海/底部手势区适配，输入不被遮挡 —— 同上
- [x] **4.4 触控目标与 hover 降级**；验收：可点击元素 ≥44×44pt —— 同上
- [x] **4.5 深色模式与系统字体缩放**；验收：深色与 200% 字体无截断 —— 同上
- [x] **4.6 组件分级与复用率盘点**；验收：移动可用组件清单归档 —— `ui_reuse_inventory.md`
- [x] **4.7 右键/长按菜单降级**；验收：长按菜单可用，右键行为不丢失 —— 同上

---

## 5. Android Tauri 2 Mobile 壳

> 依赖：2.8、3、8 ｜ 覆盖：spec §5.7、§4.5.1、§6.2 ｜ 完成状态：0/13 完成（受 Android SDK/NDK 阻塞）

- [ ] **5.1 建立移动端共享 Rust 壳工程**
  - 级别：必须 ｜ 依赖：无 ｜ 文件：`src-tauri/Cargo.toml`、`src-tauri/src/lib.rs`
  - 要求：`crate-type=["staticlib","cdylib","rlib"]`；`#[cfg_attr(mobile, tauri::mobile_entry_point)]`；仅保留移动可复用命令。
  - 验收：`cargo check` 通过；无 Agent/Git 命令注册。
- [ ] **5.2 初始化 Android 工程**
  - 级别：必须 ｜ 依赖：5.1 ｜ 文件：`src-tauri/gen/android/`（生成）
  - 要求：`tauri android init`；包名与 Bundle ID 对齐 `net.linlan.dsh`；minSdk 26。
  - 验收：Gradle sync 成功，Debug 可安装。
- [ ] **5.3 移动入口与插件注册**
  - 级别：必须 ｜ 依赖：5.2 ｜ 文件：`src-tauri/src/lib.rs`、`src-tauri/capabilities/mobile.json`
  - 要求：注册 http/clipboard-manager/notification/deep-link/os；权限最小化。
  - 验收：能力探测五项 AVAILABLE；未声明方法被拒。
- [ ] **5.4 移动端 Tauri 配置**
  - 级别：必须 ｜ 依赖：5.2 ｜ 文件：`src-tauri/tauri.conf.json`
  - 要求：`frontendDist=../h5-dist`；CSP 保持 `script-src 'self'`；版本与 `package.json` 对齐。
  - 验收：启动加载本地产物，无远程请求。
- [ ] **5.5 Android 图标与启动屏**
  - 级别：必须 ｜ 依赖：5.2 ｜ 文件：`src-tauri/icons/android/`、`res/`
  - 要求：各密度图标与启动屏齐全。
  - 验收：桌面图标与启动屏无拉伸/白屏。
- [ ] **5.6 Android 传输实现与混合内容策略**
  - 级别：必须 ｜ 依赖：5.3 ｜ 文件：`src/platform/impl/tauri_transport.ts`、Android 配置
  - 要求：REST/SSE 走插件；公网 HTTPS；局域网明文需显式确认；混合内容拦截有可执行提示。
  - 验收：局域网连接成功；公网 http 被拒。
- [ ] **5.7 Android 安全存储（Keystore/EncryptedSharedPreferences）**
  - 级别：必须 ｜ 依赖：5.3 ｜ 文件：`src-tauri/plugins/credential_android/`
  - 要求：仅存凭据引用；save/read/delete/exists 四操作；卸载重装不可恢复。
  - 验收：文件系统无明文；重装需重新配对。
- [ ] **5.8 Android 文件选择、导出与分享**
  - 级别：必须 ｜ 依赖：5.3 ｜ 文件：`src-tauri/plugins/file_android/`
  - 要求：SAF 选择；FileProvider 导出；系统分享；取消返回 `CANCELLED`。
  - 验收：选择→上传、导出→分享成功；取消无错误。
- [ ] **5.9 Android 通知与权限**
  - 级别：必须 ｜ 依赖：5.3 ｜ 文件：`plugins/system_android/`、`AndroidManifest.xml`
  - 要求：POST_NOTIFICATIONS 运行时申请；拒绝后仅无提醒。
  - 验收：授权/拒绝两态正确。
- [ ] **5.10 Android 深链、外部打开、剪贴板、网络状态、生命周期、版本**
  - 级别：必须 ｜ 依赖：5.3 ｜ 文件：`plugins/system_android/`
  - 要求：`dsh://connect` 直达连接页；前后台事件各一次；版本读取一致。
  - 验收：六项逐条通过。
- [ ] **5.11 Android 明文与网络安全配置**
  - 级别：必须 ｜ 依赖：5.6 ｜ 文件：`res/xml/network_security_config.xml`
  - 要求：默认禁止明文；仅回环放行；局域网需用户确认。
  - 验收：公网明文阻断，回环可用。
- [ ] **5.12 Android 签名与 APK/AAB 构建**
  - 级别：必须 ｜ 依赖：5.11 ｜ 文件：`gen/android/keystore.properties`（不入库）、CI secrets
  - 要求：release 签名；APK/AAB 双产物；不打包 Agent/JRE。
  - 验收：`assembleRelease`/`bundleRelease` 成功；APK ≤30MB。
- [ ] **5.13 Android 真机闭环**
  - 级别：必须 ｜ 依赖：5.6–5.12 ｜ 文件：`docs/specs/mobile_app_evolution/test_records/android.md`
  - 要求：连接→会话→对话→流式→审批→文件→通知；断网恢复；后台 5 分钟先对账。
  - 验收：全链路一次通过，无重复消息，崩溃/白屏 0。

---

## 6. HarmonyOS ArkTS/ArkUI + ArkWeb 壳（方案 1）

> 依赖：3、2.8 ｜ 覆盖：spec §5.6、§4.3.9/§4.3.10 ｜ 完成状态：9/15 完成

- [x] **6.1 建立 HarmonyOS 工程**；验收：DevEco 可打开并构建 —— `harmony/`
- [x] **6.2 ArkWeb 容器创建与能力配置**；验收：`Web` 组件加载本地页 —— `pages/Index.ets`
- [x] **6.3 加载同一份产物（rawfile / 自定义 scheme）**；验收：`$rawfile("h5/index.html")` 加载成功 —— `rawfile/h5/`
- [x] **6.4 资源加载失败、白屏与渲染崩溃恢复**；验收：错误态 + 重新加载 —— `Index.ets`
- [x] **6.5 JSBridge：单命名空间、版本、白名单、超时、审计**；验收：未知方法返回 `UNSUPPORTED` —— `bridge/DshBridge.ets`
- [ ] **6.6 鸿蒙安全存储桥**
  - 级别：必须 ｜ 依赖：6.5 ｜ 文件：`bridge/DshBridge.ets`（或拆分能力模块）
  - 要求：接入系统安全存储，保持白名单与返回模型；仅存引用，不落明文。
  - 验收：save/read/delete 正确；重装不可恢复。
- [ ] **6.7 鸿蒙文件选择桥（H5 原生入口）**
  - 级别：必须 ｜ 依赖：6.5 ｜ 文件：同上 + `Index.ets`
  - 要求：文件选择；取消返回 `CANCELLED`；超大文件降级提示。
  - 验收：选择→读取成功；取消无错误。
- [ ] **6.8 鸿蒙文件导出与系统分享桥**
  - 级别：必须 ｜ 依赖：6.5 ｜ 文件：同上
  - 要求：导出到用户目录 + 系统分享；失败可读提示。
  - 验收：导出→分享成功。
- [ ] **6.9 通知、剪贴板、网络状态、外部打开桥**
  - 级别：必须 ｜ 依赖：6.5 ｜ 文件：同上
  - 要求：逐项接系统 Kit，权限被拒返回 `DENIED`。
  - 验收：四能力真机可用；拒绝态有降级。
- [ ] **6.10 生命周期与前后台流式策略**
  - 级别：必须 ｜ 依赖：6.5 ｜ 文件：`entryability/EntryAbility.ets`
  - 要求：前后台事件去重；后台 >5 分钟释放流式连接；回前台先对账。
  - 验收：事件各一次；回前台不续写未对账消息。
- [x] **6.11 权限最小化与用途声明**；验收：仅 INTERNET，用途文案齐全 —— `module.json5`
- [x] **6.12 明文与网络传输策略**；验收：默认禁明文，仅回环放行 —— `network_config.json`
- [x] **6.13 深链**；验收：`dsh://connect` 直达连接页 —— `module.json5`
- [x] **6.14 诊断导出**；验收：导出含宿主/壳版本/产物哈希/桥版本 —— `DshBridge.ets`
- [ ] **6.15 鸿蒙真机闭环与附录 F 预验收**
  - 级别：必须 ｜ 依赖：6.6–6.14 ｜ 文件：`test_records/harmony.md`
  - 要求：安装→连接→对话→流式→审批→文件→通知；ATS/明文策略验证。
  - 验收：附录 F H-01–H-20 鸿蒙相关项通过，证据归档。

---

## 7. iOS Tauri 2 Mobile 壳

> 依赖：5.1、2.8、3、8 ｜ 覆盖：spec §5.7、§4.5.1、design §2.8 ｜ 完成状态：0/7 完成（Xcode 已安装未启用）

- [ ] **7.1 初始化 iOS 工程**
  - 级别：必须 ｜ 依赖：5.1 ｜ 文件：`src-tauri/gen/apple/`（生成）
  - 要求：`tauri ios init`；最低 iOS 15.0；Bundle ID `net.linlan.dsh`；签名团队配置。
  - 验收：`tauri ios build --debug` 通过；模拟器可启动并加载 `h5-dist`。
- [ ] **7.2 ATS 与本地网络权限**
  - 级别：必须 ｜ 依赖：7.1 ｜ 文件：`gen/apple/**/Info.plist`
  - 要求：`NSAllowsLocalNetworking=true`；**不使用** `NSAllowsArbitraryLoads`；`NSLocalNetworkUsageDescription`；如需 Bonjour 声明 `NSBonjourServices`；公网仅 HTTPS。
  - 验收：局域网 http 可连；公网 http 被 ATS 阻断；审核说明可解释。
- [ ] **7.3 iOS Keychain 凭据插件**
  - 级别：必须 ｜ 依赖：5.3 ｜ 文件：`src-tauri/plugins/credential_ios/`、`src/platform/impl/tauri_credential.ts`
  - 要求：Keychain save/read/delete/exists；`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`；仅暴露引用。
  - 验收：四操作正确；日志/文件无明文；重装需重新配对。
- [ ] **7.4 iOS 文件选择、导出与分享**
  - 级别：必须 ｜ 依赖：5.3 ｜ 文件：`plugins/file_ios/`、`src/platform/impl/tauri_file.ts`
  - 要求：`UIDocumentPickerViewController` 选择/导出；`UIActivityViewController` 分享；取消返回 `CANCELLED`。
  - 验收：选择→上传、导出→分享成功；大文件降级。
- [ ] **7.5 iOS 通知、深链、生命周期**
  - 级别：必须 ｜ 依赖：5.3 ｜ 文件：`plugins/system_ios/`、`Info.plist`（`CFBundleURLTypes`）
  - 要求：通知授权/拒绝两态；`dsh://` scheme（优先）；前后台事件去重；版本读取。
  - 验收：授权两态正确；深链直达连接页；事件各一次。
- [ ] **7.6 TestFlight 签名与构建**
  - 级别：必须 ｜ 依赖：7.2 ｜ 文件：`gen/apple` 签名、`.github/workflows/ios_build.yml`
  - 要求：archive + IPA；版本号/构建号；TestFlight 内部测试组；不打包 Agent。
  - 验收：archive 成功；IPA ≤45MB；TestFlight 可安装。
- [ ] **7.7 iOS 真机/TestFlight 闭环**
  - 级别：必须 ｜ 依赖：7.3–7.6 ｜ 文件：`test_records/ios.md`
  - 要求：连接→对话→流式→审批→文件/分享→通知；Keychain 持久化；ATS 策略；后台恢复。
  - 验收：全链路通过；无明文凭据；无 ATS 误拦截。

---

## 8. 连接、配对与凭据（跨端）

> 依赖：2、8.1 ｜ 覆盖：spec §5.4、§6.1/§6.2、§4.3 ｜ 完成状态：8/9 完成

- [x] **8.1 服务端设备配对与吊销接口**；验收：一次性、≤10 分钟、单设备吊销 —— `../dsh-java`
- [x] **8.2 设备凭据签发、指纹与轮换**；验收：仅存 SHA-256 摘要，轮换后恢复 —— `../dsh-java`
- [ ] **8.3 配对 UI：扫码 + 短码双路径**
  - 级别：必须 ｜ 依赖：8.1、8.2 ｜ 文件：`../dsh-java-desktop` 移动端配对页
  - 要求：契约与双路径 UI 已具备；补齐扫码实现（相机权限被拒仍可手输短码）。
  - 验收：两条路径均完成配对；生成到成功 ≤60 秒。
- [x] **8.4 连接配置管理**；验收：新增/编辑/切换，凭据只存引用 —— `src/platform/connection.ts`
- [x] **8.5 连接状态机与退避**；验收：六态迁移正确，连续失败 3 次退避 —— `src/lib/agent-client.ts`
- [x] **8.6 公网 HTTPS 校验与明文阻断**；验收：公网 http 被拒，局域网需确认 —— `src/platform/connection.ts`
- [x] **8.7 单写多读冲突处理**；验收：并发写入不丢消息 —— `src/lib/agent-client.ts`
- [x] **8.8 桌面端"允许移动设备连接"开关**；验收：默认关闭，开启后强制鉴权 —— `../dsh-java-desktop`
- [x] **8.9 旧版 mobile 配置迁移**；验收：升级不清空连接配置 —— 迁移逻辑

---

## 9. 原生能力迁移：SSH / Relay / 扫码 / 安全存储

> 依赖：5、6、7 ｜ 覆盖：spec §7.2、§1.4 ｜ 完成状态：1/9 完成（选型未拍板）

- [ ] **9.1 SSH 端口转发（Tauri 插件）**
  - 级别：建议 ｜ 依赖：5.1 ｜ 文件：`src-tauri/plugins/ssh/`
  - 要求：基于 `russh`（待拍板）；仅转发，不内嵌 Agent。
  - 验收：本地端口转发可用；失败可读提示。
- [ ] **9.2 SSH 凭据与 host key 校验**
  - 级别：建议 ｜ 依赖：9.1 ｜ 文件：同上 + 安全存储
  - 要求：私钥入安全存储；host key 变更需确认。
  - 验收：无明文私钥；首次连接指纹确认。
- [ ] **9.3 Relay 客户端（Tauri 插件，待决策）**
  - 级别：可选 ｜ 依赖：9.1 ｜ 文件：`plugins/relay/`
  - 要求：是否建设中继由用户拍板；若建设，必须端到端鉴权。
  - 验收：决策记录归档；未建设时能力返回 `UNSUPPORTED`。
- [ ] **9.4 Android/iOS 扫码**
  - 级别：建议 ｜ 依赖：5.3、7.5 ｜ 文件：Android CameraX+MLKit / iOS AVFoundation
  - 要求：相机权限被拒可手输短码。
  - 验收：扫码成功率高；拒绝态可降级。
- [ ] **9.5 鸿蒙扫码**
  - 级别：建议 ｜ 依赖：6.9 ｜ 文件：`bridge/DshBridge.ets`
  - 要求：扫码 + 手输双路径。
  - 验收：两条路径均可用。
- [ ] **9.6 鸿蒙 SSH（待决策）**
  - 级别：可选 ｜ 依赖：9.5 ｜ 文件：`harmony/`
  - 要求：随 9.3 决策。
  - 验收：决策记录归档。
- [ ] **9.7 鸿蒙 Relay（待决策）**
  - 级别：可选 ｜ 依赖：9.5 ｜ 文件：`harmony/`
  - 要求：随 9.3 决策。
  - 验收：决策记录归档。
- [ ] **9.8 三端安全存储一致性测试**
  - 级别：必须 ｜ 依赖：5.7、7.3、6.6 ｜ 文件：`test_records/`
  - 要求：Keychain/Keystore/鸿蒙安全存储同语义：仅引用、重装不可恢复、吊销即失效。
  - 验收：三端逐项通过，证据归档。
- [x] **9.9 legacy 参考映射与冻结边界说明**；验收：legacy 资产不进入构建 —— `legacy_reference_mapping.md`

---

## 10. 工程基建与文档

> 依赖：1–9 ｜ 覆盖：spec §5.9、§4.4 ｜ 完成状态：8/11 完成

- [x] **10.1 重写 README**；验收：中英双语，命令可执行 —— `README.md`、`README.en.md`
- [x] **10.2 按 React/Tauri 重建 `.gitignore`**；验收：产物/依赖/签名文件均忽略 —— `.gitignore`
- [x] **10.3 CI：H5 构建、测试、哈希与制品**；验收：工作流可执行 —— `.github/workflows/`
- [x] **10.4 CI：契约测试**；验收：`DSH_CONTRACT_REQUIRED=1` 失败即阻断 —— 同上
- [ ] **10.5 CI：Android 构建**
  - 级别：必须 ｜ 依赖：5.12 ｜ 文件：`.github/workflows/android_build.yml`
  - 要求：SDK/签名 secrets；APK/AAB 制品上传。
  - 验收：CI 构建成功，制品可下载。
- [ ] **10.6 CI：iOS 构建**
  - 级别：必须 ｜ 依赖：7.6 ｜ 文件：`.github/workflows/ios_build.yml`
  - 要求：macOS runner、证书与 provisioning secrets、archive。
  - 验收：CI archive 成功。
- [ ] **10.7 CI：HarmonyOS 构建**
  - 级别：必须 ｜ 依赖：6.15 ｜ 文件：`.github/workflows/harmony_build.yml`
  - 要求：DevEco CLI 或自托管 runner。
  - 验收：HAP 构建成功并可安装。
- [x] **10.8 能力裁剪矩阵（单一来源）**；验收：14 域 × 5 端与实现一致 —— `capability_matrix.md`
- [x] **10.9 多端版本矩阵**；验收：端 × 版本 × 契约 × 桥齐全 —— `version_matrix.md`（版本值待收口，见 13.2）
- [x] **10.10 legacy 冻结边界与构建隔离**；验收：legacy 不参与构建 —— `check_platform_boundary.mjs`
- [x] **10.11 诊断与日志规范**；验收：五项诊断要素齐全 —— `diagnostics_spec.md`

---

## 11. 验证与发布

> 依赖：1–10 ｜ 覆盖：spec §5.9、§7.4 ｜ 完成状态：6/10 完成

- [x] **11.1 契约回归（五端）**；验收：五宿主用例通过 —— `tests/unit/contract.test.ts`
- [ ] **11.2 三端构建与产物哈希一致性**
  - 级别：必须 ｜ 依赖：10.5–10.7 ｜ 文件：`scripts/check_release_consistency.mjs`
  - 要求：Android/iOS/HarmonyOS 构建记录 + 产物哈希一致。
  - 验收：三端哈希一致，证据归档。
- [ ] **11.3 鸿蒙六项复测与证据归档**
  - 级别：必须 ｜ 依赖：3.8、6.15 ｜ 文件：`harmony_poc_record.md`
  - 要求：六项结论 + 设备信息 + 截图。
  - 验收：六项均有证据，无阻断项。
- [ ] **11.4 附录 F 全项验收（H-01–H-20）**
  - 级别：必须 ｜ 依赖：5.13、6.15、7.7 ｜ 文件：`acceptance_evidence.md`
  - 要求：机器项 PASS，真机项回填设备/系统/壳版本/产物哈希。
  - 验收：全部 PASS；未通过项写明现象与复现步骤。
- [ ] **11.5 性能与包体验收**
  - 级别：必须 ｜ 依赖：11.4 ｜ 文件：`performance_acceptance.md`
  - 要求：冷启动 ≤2.5s、首字节 ≤1s、内存 ≤300MB、包体达标。
  - 验收：指标实测并归档，超限阻断发布。
- [x] **11.6 安全验收（凭据、明文、桥、脱敏）**；验收：四类通过 —— `security_acceptance.md`
- [x] **11.7 商店合规与隐私物料**；验收：隐私政策/权限文案/截图齐全 —— `store_compliance.md`
- [x] **11.8 发布检查单、灰度与回滚**；验收：检查项与回滚路径可执行 —— `release_checklist.md`
- [x] **11.9 已知限制与发布说明**；验收：限制与实际一致 —— `known_limits.md`
- [x] **11.10 桌面端回归**；验收：11 项全 PASS —— `scripts/desktop_regression.mjs`

---

## 12. 小程序（轻量入口）

> 依赖：2 ｜ 覆盖：spec §5.8、§4.1.6 ｜ 完成状态：2/3 完成

- [x] **12.1 Taro 工程与协议 SDK 复用**；验收：`npm run build:weapp` 成功，无第二套 UI —— `miniapp/`
- [ ] **12.2 域名白名单、登录态与订阅消息**
  - 级别：必须 ｜ 依赖：12.1 ｜ 文件：`miniapp/src/sdk/auth.ts`、后端配置
  - 要求：微信 AppID/AppSecret 配置；HTTPS 域名白名单；订阅消息模板；隐私授权声明。
  - 验收：登录成功；缺凭证返回 50300 且不降级匿名。
- [x] **12.3 包体门禁与能力降级**；验收：主包 ≤2MB、总包 ≤20MB，能力按矩阵降级 —— `miniapp/scripts/`

---

## 13. v0.2.0 版本与文档收口（本版本新增）

> 依赖：全部 ｜ 覆盖：spec §5.9、§6.5、§7.1 ｜ 完成状态：0/8 完成

- [ ] **13.1 统一壳版本为 0.2.0**
  - 级别：必须 ｜ 依赖：无 ｜ 文件：`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`
  - 要求：两处由 `0.1.0` 改为 `0.2.0`，与 `package.json` 一致。
  - 验收：`grep` 两文件版本均为 `0.2.0`。
- [ ] **13.2 更新版本矩阵**
  - 级别：必须 ｜ 依赖：13.1 ｜ 文件：`docs/specs/mobile_app_evolution/version_matrix.md`
  - 要求：Android/iOS/HarmonyOS/小程序版本由 `0.1.0` 更新为 `0.2.0`，状态标注骨架/待发布。
  - 验收：矩阵版本与 `package.json` 一致。
- [ ] **13.3 鸿蒙桥版本联动**
  - 级别：必须 ｜ 依赖：13.1 ｜ 文件：`harmony/entry/src/main/ets/bridge/DshBridge.ets`
  - 要求：`app.version` 不再硬编码 `0.1.0`，读取壳版本或构建注入。
  - 验收：返回版本为 `0.2.0`；`bridgeVersion` 仍为 `1`。
- [ ] **13.4 产物元数据版本联动**
  - 级别：必须 ｜ 依赖：13.1 ｜ 文件：`h5-dist/artifact_meta.json`、`rawfile/h5/artifact_meta.json`
  - 要求：重新执行 `gen_artifact_meta` + `distribute_h5`，使 `artifact_version` 为 `0.2.0`。
  - 验收：两处 `artifact_version=0.2.0` 且 `content_hash` 一致。
- [ ] **13.5 CHANGELOG 与实际交付对齐**
  - 级别：建议 ｜ 依赖：13.1–13.4 ｜ 文件：`CHANGELOG.md`
  - 要求：修正 0.2.0 条目中"版本已统一"的表述，或补齐后保留。
  - 验收：CHANGELOG 声明与实测一致。
- [ ] **13.6 小程序版本对齐**
  - 级别：建议 ｜ 依赖：无 ｜ 文件：`miniapp/package.json`
  - 要求：`0.1.0` → `0.2.0`（若小程序随 0.2.0 发布）。
  - 验收：版本一致；构建通过。
- [ ] **13.7 iOS 工程初始化与工具链预检**
  - 级别：必须 ｜ 依赖：13.1 ｜ 文件：`scripts/preflight_ios.mjs`（新增）、`docs/0.2.0/XCode.md`
  - 要求：预检 `xcode-select`/`xcodebuild`/CocoaPods/模拟器 runtime/Rust iOS target；失败给出逐项修复命令。
  - 验收：预检脚本退出码正确；`npm run ios:init` 可执行。
- [ ] **13.8 四件套归档与交叉校验**
  - 级别：可选 ｜ 依赖：13.1–13.7 ｜ 文件：`docs/0.2.0/`
  - 要求：`spec.md`/`design.md`/`tasks.md`/`release-v0.2.0-development-notes.md` 齐备，统计与总清单一致。
  - 验收：四件套齐备；72/52 统计与 `mobile_app_evolution/tasks.md` 可复核。

---

## 附录 A：任务统计复核口径

| 项 | 口径 |
| --- | --- |
| 主任务 | `## n.` 标题 |
| 子任务 | 可勾选条目（`- [x]` / `- [ ]`） |
| 级别 | 条目内"级别："字段；无标注者继承总清单 |
| 完成判定 | 验收命令/证据可执行且已归档 |
| 与总清单关系 | 第 1–12 组对应 `docs/specs/mobile_app_evolution/tasks.md` 的 116 子任务；第 13 组为本版本新增 8 条 |

> 交叉引用：需求见 `spec.md`；实现见 `design.md`；发布结论见 `release-v0.2.0-development-notes.md`。