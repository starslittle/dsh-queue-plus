# dsh-queue-plus

[English](./README.en.md) | 简体中文

把 DeepSeek Harness 的排队消息整合成一个简单、完整的面板：**编辑、删除、插话、调整顺序、清空全部和 10 秒撤销**。

Queue Plus 使用 DSH 官方插槽的优先级覆盖机制接管 QueueDock，不隐藏 DOM，也不会重复渲染同一批消息。插件卸载或停止后，官方 QueueDock 会自动恢复。

## 功能

- 默认模式保留编辑、删除和“插话发送”；单条删除采用行内确认，避免误触。
- 点击“排序”后，同一个列表原地切换为执行顺序视图，不再出现第二个面板或滚动条。
- 拖动手柄调整顺序，并提供上移 / 下移按钮支持键盘和触屏。
- 一键清空全部排队消息。
- 清空后 10 秒内撤销；恢复的旧消息排在撤销期间新加入消息之前。
- 移动成功后即时呈现服务端返回的顺序，再由 DSH 权威队列快照确认。
- 并发保护：请求携带用户点击时看到的完整顺序；若 Agent 或另一个页面已经改变队列，本次操作会拒绝而不是误排。
- 移动端操作区域放大到至少 44px，并提供清晰的键盘焦点和读屏提示。

## 安装

> 当前工作区是尚未发布的 v0.2.0。下面的 v0.1.0 Release 仍是旧版独立排序面板；测试新界面请使用后文的本地 `link:` 开发安装。

推荐安装 Release 中的预构建包，无需授权安装脚本：

```bash
dsh plugin --profile web add -w https://github.com/starslittle/dsh-queue-plus/releases/download/v0.1.0/dsh-queue-plus-0.1.0.tgz
```

重启 `dsh web`。运行中连续发送至少两条“排队”消息，队列标题旁会出现“排序”；点击后在原列表内调整执行顺序。

也可以锁定版本，从 GitHub 源码安装：

```bash
dsh plugin --profile web add github:starslittle/dsh-queue-plus#v0.1.0
```

源码安装会运行仓库自带的 `prepare` 构建。pnpm 10 及以上版本会要求用户先在对应 profile 的 `pnpm-workspace.yaml` 中显式允许 `dsh-queue-plus` 执行构建；只应对可信源码开启此权限。

## 源码开发

```bash
pnpm install
pnpm run check
dsh plugin --profile web add -w link:/absolute/path/to/dsh-queue-plus
```

若后续发布到 npm，也可直接安装：

```bash
dsh plugin --profile web add dsh-queue-plus
```

更新与卸载：

```bash
dsh plugin --profile web update dsh-queue-plus
dsh plugin --profile web remove dsh-queue-plus
```

## 设计边界

- 排序使用一次连续区间替换，Host 观察者不会看到“先删除、再插入”的中间队列。
- 浏览器只渲染一个队列面板；排序模式复用同一组权威消息，不复制业务状态。
- 清空撤销记录只保存在当前 Host 进程内，限时 10 秒，最多保留 64 条记录。
- Host 重启、Agent 被替换、撤销超时，或原消息身份已经重新进入队列后，撤销会被拒绝。
- 不操作 steering / context 队列，也不允许直接管理由父 Agent 所有的 subagent 队列。
- 浏览器通过同源 `application/json` POST 调用专属入口；响应禁用缓存，请求体有大小上限。

## 兼容性

面向 `@deepseek-ai/* 0.1.0-rc.6` 的公开 Agent Inbox 与 Web 插件契约构建。插件依赖 `ConversationSnapshot.queue`、`Agent.inbox.splice()`、`agents` 与 `webServer` 服务；这些尚处于 RC 阶段，DSH 若修改相应公开契约，需要同步升级插件。

构建产物位于 `lib/`：Host 为 `lib/index.js`，Browser 为 `lib/client.js`。

`prepare` 是完全位于本仓库内的消费端构建，不依赖相邻的 DSH 源码 checkout，供 Git 安装使用。

## License

MIT
