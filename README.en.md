# dsh-queue-plus

English | [简体中文](./README.md)

A better stock queue: edit, remove, and steer, plus reorder, clear-all, and 10-second undo.

Turning it off or uninstalling restores the built-in queue immediately.

![Reorder, clear, and 10-second undo](docs/demo.gif)

## Install

```sh
dsh plugin --profile web add github:starslittle/dsh-queue-plus
```

Restart `dsh web`. Queue at least two prompts. **Sort** appears next to the queue title.

Prebuilt package (no install-script permission):

```sh
dsh plugin --profile web add -w https://github.com/starslittle/dsh-queue-plus/releases/download/v0.2.0/dsh-queue-plus-0.2.0.tgz
```

## What you can do

- Edit, remove, and steer, same as the stock queue
- Click **Sort** and drag to change execution order in place
- Clear the whole queue; undo for 10 seconds
- If someone else changed the queue, the action is rejected instead of scrambling it

## Check that it loaded

| What you see | What to do |
|---|---|
| **Sort** appears after two queued prompts | It is on |
| No **Sort** | Restart, and use queue-send rather than send-now |
| Uninstall restores the stock queue | Expected |

## Limits

- Undo lives in the current Host process only, for 10 seconds
- It does not touch steer / context queues or a parent agent's child queues
- Uninstall restores the stock queue automatically

<details>
<summary>Pin a version, source install, and development</summary>

```sh
dsh plugin --profile web add github:starslittle/dsh-queue-plus#v0.2.0
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

Built against the public `@deepseek-ai/* 0.1.0-rc.6` Agent Inbox and Web plugin contracts. Those are still release candidates.

</details>

## License

MIT
