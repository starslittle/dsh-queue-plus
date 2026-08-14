# dsh-queue-plus

English | [简体中文](./README.md)

Three focused controls for the DeepSeek Harness prompt queue: **reorder, clear all, and 10-second undo**.

Queue Plus complements the official QueueDock instead of replacing it. The official dock keeps ownership of edit, remove, and steer; Queue Plus appears when at least two prompts are queued and handles ordering and bulk cleanup.

## Features

- Reorder pending prompts with drag and drop.
- Move-up and move-down buttons for keyboard and touch use.
- Clear the complete next-turn queue in one action.
- Undo clear-all for 10 seconds; restored prompts stay ahead of work added during the undo window.
- Compare-and-swap protection rejects stale browser actions instead of mutating a queue that has already changed.
- DSH-native spacing, colors, icons, Chinese and English UI copy.

## Install

The recommended path is the prebuilt Release archive, which needs no install-script permission:

```bash
dsh plugin --profile web add -w https://github.com/starslittle/dsh-queue-plus/releases/download/v0.1.0/dsh-queue-plus-0.1.0.tgz
```

Restart `dsh web`. Queue at least two prompts while an agent is running; “Adjust run order” appears below the official queue.

You can also pin a version and install from GitHub source:

```bash
dsh plugin --profile web add github:starslittle/dsh-queue-plus#v0.1.0
```

Source installation runs the repository's self-contained `prepare` build. pnpm 10 and later require the user to explicitly allow `dsh-queue-plus` builds in that profile's `pnpm-workspace.yaml`; only grant that permission to source you trust.

## Develop from source

```bash
pnpm install
pnpm run check
dsh plugin --profile web add -w link:/absolute/path/to/dsh-queue-plus
```

If the package is later published to npm:

```bash
dsh plugin --profile web add dsh-queue-plus
```

Update or remove it with:

```bash
dsh plugin --profile web update dsh-queue-plus
dsh plugin --profile web remove dsh-queue-plus
```

## Safety and scope

- A reorder is one contiguous replacement splice, so Host observers see only the final order.
- Undo records live only in the current Host process for 10 seconds, with at most 64 records retained.
- Undo is rejected after Host restart, Agent replacement, timeout, or an identity conflict.
- The plugin does not touch steering/context queues or queues owned by a parent Agent.
- The browser uses a same-origin `application/json` POST route; responses disable caching and request bodies are capped.

## Compatibility

Built against the public `@deepseek-ai/* 0.1.0-rc.6` Agent Inbox and Web plugin contracts. Those contracts are still release candidates; a future DSH contract change may require a plugin update.

Build output is in `lib/`: `lib/index.js` for the Host and `lib/client.js` for the browser.

The consumer-side `prepare` build stays entirely inside this repository and does not depend on a neighboring DSH source checkout.

## License

MIT
