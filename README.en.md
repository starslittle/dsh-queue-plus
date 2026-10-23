# dsh-queue-plus

English | [简体中文](./README.md)

A cleaner DSH queue panel for **editing, removing, steering, reordering, and bulk removal**.

![Queue Plus real interaction demo](./assets/dsh-queue-plus-demo.gif)

Queue Plus takes over QueueDock through DSH's public slot mechanism without hiding or duplicating queued messages. The stock queue returns automatically when the plugin is disabled or removed.

## Features

- Edit, remove, or steer queued prompts.
- Drag messages, or use the arrow buttons to reorder them.
- Remove all with confirmation and DSH's official per-item removal.
- Auto-expand new queues and remember manual collapse.
- Supports Chinese, English, keyboard, and touch controls.

## Install

The recommended install is the prebuilt Release archive, which needs no install-script permission:

```sh
dsh plugin --profile web add -w https://github.com/starslittle/dsh-queue-plus/releases/download/v0.4.0/dsh-queue-plus-0.4.0.tgz
```

Restart `dsh web`. Queue at least two prompts while an agent is running; **Sort** appears next to the queue title.

## Check that it loaded

| What you see | What to do |
|---|---|
| **Sort** appears after two queued prompts | It is on |
| No **Sort** | Restart, and use queue-send rather than send-now |
| Uninstall restores the stock queue | Expected |

## Limits

- Single and bulk removal both call DSH's official `conversation.updateQueue(..., { kind: 'remove' })` operation.
- Remove all deletes the durable queued rows captured at confirmation time, and leaves local echoes that are still sending. Concurrent changes may cause partial completion, and later messages are left in place.
- Reordering uses server confirmation and stale-order protection, rejecting a changed queue instead of scrambling it. Sorting is available on the parent session.
- A continuable subagent can edit, remove, and steer. A one-shot subagent queue stays read-only. Steering and context queues stay out of this dock.
- The stock queue returns automatically after uninstall.

<details>
<summary>Pin a version, source install, and development</summary>

```sh
dsh plugin --profile web add github:starslittle/dsh-queue-plus#v0.4.0
```

Source install runs this repo's `prepare` build. pnpm 10+ requires an explicit allow in that profile's `pnpm-workspace.yaml`; only grant it to source you trust.

```sh
pnpm install
pnpm run check
dsh plugin --profile web add -w link:/absolute/path/to/dsh-queue-plus
```

```sh
dsh plugin --profile web update dsh-queue-plus
dsh plugin --profile web remove dsh-queue-plus
```

Built against the public `@deepseek-ai/* 0.2.1-rc.2` Agent Inbox and Web plugin contracts. Queued rows come from `inbox["next-turn"]` and are not filtered by `placement`. Those contracts are still release candidates.

</details>

## License

MIT
