# dsh-queue-plus

[English](./README.en.md) | 简体中文

把 DeepSeek Harness 的排队消息整合成一个简单、完整的面板：**编辑、删除、插话、调整顺序和删除全部**。

![Queue Plus 真实交互演示](./assets/dsh-queue-plus-demo.gif)

Queue Plus 使用 DSH 官方插槽接管 QueueDock，不隐藏或复制排队消息；停用或卸载插件后，官方队列会自动恢复。

## 功能

- 默认模式保留编辑、删除和“插话发送”；单条删除采用行内确认，避免误触。
- 点击“排序”后，同一个列表原地切换为执行顺序视图，不再出现第二个面板或滚动条。
- 拖动手柄调整顺序，并提供上移 / 下移按钮支持键盘和触屏。
- 删除全部采用行内二次确认，并依次调用 DSH 官方单条删除操作。
- 批量删除只处理点击确认时已经显示的消息，不会误删随后新加入的消息。
- 移动成功后即时呈现服务端返回的顺序，再由 DSH 权威队列快照确认。
- 并发保护：请求携带用户点击时看到的完整顺序；若 Agent 或另一个页面已经改变队列，本次操作会拒绝而不是误排。
- 移动端操作区域放大到至少 44px，并提供清晰的键盘焦点和读屏提示。

## 安装

推荐安装 Release 中的预构建包，无需授权安装脚本：

```sh
dsh plugin --profile web add -w https://github.com/starslittle/dsh-queue-plus/releases/download/v0.3.0/dsh-queue-plus-0.3.0.tgz
```

重启 `dsh web`。运行中连续发送至少两条“排队”消息，队列标题旁会出现“排序”。

## 装完怎么验

| 现象 | 怎么办 |
|---|---|
| 排队两条后标题旁出现「排序」 | 已生效 |
| 没有「排序」 | 确认已重启，并选「排队发送」而不是马上发送 |
| 关掉或卸载后队列变回原样 | 正常 |

## 边界

- 单条和批量删除都调用 DSH 官方 `conversation.updateQueue(..., { kind: 'remove' })`。
- 删除全部只处理确认时可见的消息；并发变化时可能部分完成，不会误删随后加入的消息。
- 排序使用服务端确认和并发保护；若队列已经变化，本次排序会拒绝而不是排乱。
- 不操作 steering / context 队列，也不管理父 Agent 所有的 subagent 队列。
- 卸载后官方队列自动恢复。

<details>
<summary>指定版本、源码与开发</summary>

锁定版本、从 GitHub 源码安装：

```sh
dsh plugin --profile web add github:starslittle/dsh-queue-plus#v0.3.0
```

源码安装会跑仓库自带的 `prepare` 构建。pnpm 10 及以上需要先在对应 profile 的 `pnpm-workspace.yaml` 里允许 `dsh-queue-plus` 执行构建；只对可信源码开这个权限。

本地开发：

```sh
pnpm install
pnpm run check
dsh plugin --profile web add -w link:/absolute/path/to/dsh-queue-plus
```

更新与卸载：

```sh
dsh plugin --profile web update dsh-queue-plus
dsh plugin --profile web remove dsh-queue-plus
```

面向 `@deepseek-ai/* 0.1.0-rc.6` 的公开 Agent Inbox 与 Web 插件契约。DSH 仍在 RC，契约若改需要同步升级插件。

</details>

## 许可

MIT
