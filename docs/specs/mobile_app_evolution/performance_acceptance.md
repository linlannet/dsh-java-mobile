# 性能与包体验收（基线）

## 构建产物体积（本机实测，随构建变化）

- 首屏关键资源（gzip）：约 364 KB（限额 1 MB，通过）
- 完整产物（gzip）：约 1.35 MB（限额 4 MB，通过）
- 未压缩总字节：约 4.32 MB

> 具体数值以 `node scripts/check_h5_size.mjs ../dsh-java-desktop/dist` 实时输出为准。

## 已做优化

1. `echarts`、`xlsx`、`mammoth` 拆为独立 chunk，首屏不加载。
2. Tauri 能力层（transport/native/credential）按运行时动态加载，浏览器构建不加载。
3. 产物哈希与体积由 CI 门禁守住。

## 待真机补充指标

| 指标 | 目标 | 状态 |
| --- | --- | --- |
| 冷启动到首屏 | ≤ 1.5s（中端机） | 待测 |
| 会话切换 | ≤ 200ms | 待测 |
| 流式首字节 | ≤ 1s | 待测 |
| 内存峰值 | ≤ 300MB | 待测 |
| 安装包体积 | Android ≤ 30MB / iOS ≤ 40MB / HAP ≤ 30MB | 待测 |
| 长会话滚动帧率 | ≥ 50fps | 待测 |

## 验收结论

- 构建侧体积门禁已通过。
- 真机性能指标需在具备 Android SDK / Xcode / DevEco 的环境执行后回填。