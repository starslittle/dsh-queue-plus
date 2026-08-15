# dsh-queue-plus

[English](./README.en.md) | 简体中文

出厂排队消息的增强面板：编辑、删除、插话，再加上排序、清空和 10 秒撤销。

关掉或卸载后，自带队列立刻回来。

![排序、清空与 10 秒撤销](docs/demo.gif)

## 安装

```sh
dsh plugin --profile web add github:starslittle/dsh-queue-plus
```

重启 `dsh web`。连发至少两条「排队」消息，队列标题旁会出现「排序」。

预构建包（不用授权构建脚本）：

```sh
dsh plugin --profile web add -w https://github.com/starslittle/dsh-queue-plus/releases/download/v0.2.0/dsh-queue-plus-0.2.0.tgz
```

## 能做什么

- 和自带队列一样能改、删、插话
- 点「排序」后原地拖拽改执行顺序
- 一键清空，10 秒内可撤销
- 别人同时改了队列，这次操作会被拒绝，不会排乱

## 装完怎么验

| 现象 | 怎么办 |
|---|---|
| 排队两条后标题旁出现「排序」 | 已生效 |
| 没有「排序」 | 确认已重启，并选「排队发送」而不是马上发送 |
| 关掉或卸载后队列变回原样 | 正常 |

## 边界

- 撤销只在本机当前进程里有效，限时 10 秒
- 不管插话队列、上下文队列和子 agent 的队列
- 卸载后自带队列自动恢复

<details>
<summary>指定版本、源码与开发</summary>

锁定版本、从 GitHub 源码安装：

```sh
dsh plugin --profile web add github:starslittle/dsh-queue-plus#v0.2.0
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
