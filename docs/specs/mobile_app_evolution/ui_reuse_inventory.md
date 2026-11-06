# UI 组件分级与复用率盘点

> 依据 `dsh-java-desktop/src/components` 实际文件统计（29 个组件 + `App.tsx`）。
> 分级：L0 = 纯展示；L1 = 业务语义（可直接跨端复用）；L2 = 页面容器（移动端可重写布局）。

## 分级清单

| 组件 | 级别 | 说明 |
| --- | --- | --- |
| AddDigitalHumanWizard | L2 | 向导容器，移动端可改为分步页 |
| ApprovalCard | L1 | 审批卡片，直接复用 |
| ArtifactPreview | L1 | 产物预览，依赖能力层文件读取 |
| AttributionAvatar | L0 | 头像展示 |
| BotsSettings | L1 | 飞书 Bot 设置 |
| CollabPanel | L1 | 协作面板 |
| ConversationView | L2 | 会话容器，移动端单列 |
| DiffView | L1 | 差异查看 |
| DigitalHumanCatalog | L1 | 数字人目录 |
| DigitalHumansSettings | L1 | 数字人设置 |
| DirTreeView | L1 | 目录树 |
| DrawioPreview | L1 | Drawio 预览 |
| EChartBlock | L0 | 图表展示 |
| ErrorBoundary | L0 | 错误边界 |
| ExtensionsSettings | L1 | 扩展设置 |
| FileActionsMenu | L1 | 文件操作菜单（移动端长按） |
| FilePreview | L1 | 文件预览 |
| GroupChatView | L1 | 群聊视图 |
| InfoRail | L2 | 信息栏，移动端底部 sheet |
| ParticipantPicker | L0 | 参与者选择 |
| PluginsSettings | L1 | 插件设置 |
| ProjectRowMenu | L1 | 项目行菜单 |
| QuestionCard | L1 | 提问卡片 |
| RightDock | L2 | 右侧坞，移动端隐藏/抽屉 |
| RoomCollaborationView | L2 | 协作房间容器 |
| SettingsView | L2 | 设置页容器，移动端全屏 |
| Sidebar | L2 | 侧边栏，移动端抽屉 |
| UpdateStatusBadge | L0 | 版本徽标 |
| icons | L0 | 图标集合 |
| App.tsx | L2 | 编排容器，需拆分连接/布局 |

## 复用率

- 总数：30（29 组件 + App.tsx）
- L0：7 → 100% 复用
- L1：15 → 100% 复用（依赖能力层降级）
- L2：8 → 布局重写、逻辑复用

按组件数计算复用率：**(7 + 15) / 30 = 73.3%**；若 L2 仅重写布局、保留业务逻辑，综合复用率约 **90%**。

## 需移动重写的 L2 容器

1. `App.tsx`：拆分连接编排与布局
2. `Sidebar`：抽屉化
3. `InfoRail`：底部 sheet
4. `RightDock`：窄屏隐藏
5. `ConversationView`：单列布局
6. `RoomCollaborationView`：单列 + 底部输入
7. `SettingsView`：全屏分页
8. `AddDigitalHumanWizard`：分步页

## 结论

复用率高于 70% 门槛，无需补充缺口计划；后续新增组件须标注级别并保持"共享组件内禁止平台判断"。