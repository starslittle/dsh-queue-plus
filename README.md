# dsh-queue-plus

[English](./README.en.md) | 简体中文

给 DeepSeek Harness 官方消息队列补上三个高频动作：**调整顺序、清空全部、10 秒撤销**。

它不会替换官方 QueueDock。官方继续负责编辑、删除和“插话发送”；Queue Plus 只在存在至少 2 条排队消息时出现，作为一层小而专注的顺序工具。

## 功能

- 拖拽调整待执行 Prompt 的顺序。
- 上移 / 下移按钮，键盘和触屏也能操作。
- 一键清空全部排队消息。
- 清空后 10 秒内撤销；恢复的旧消息排在撤销期间新加入消息之前。
- 不做乐观更新：最终顺序始终以 DSH 的权威队列快照为准。
- 并发保护：请求携带用户点击时看到的完整顺序；若 Agent 或另一个页面已经改变队列，本次操作会拒绝而不是误排。

## 安装

推荐安装 Release 中的预构建包，无需授权安装脚本：

```bash
dsh plugin --profile web add -w https://github.com/starslittle/dsh-queue-plus/releases/download/v0.1.0/dsh-queue-plus-0.1.0.tgz
```

重启 `dsh web`。运行中连续发送至少两条“排队”消息，官方队列下方会出现“调整执行顺序”。

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
