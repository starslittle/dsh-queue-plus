# dsh-queue-plus

English | [简体中文](./README.md)

A single, comfortable DeepSeek Harness queue surface for **editing, removing, steering, reordering, and removing all**.

![Queue Plus real interaction demo](./assets/dsh-queue-plus-demo.gif)

Queue Plus takes over the QueueDock through DSH's public slot-priority mechanism. It does not hide DOM or render the same messages twice, and the stock QueueDock returns automatically when the plugin unloads.

## Features

- Keep edit, remove, and steer controls in the default view; individual removal uses a compact inline confirmation.
- Switch the same list in place with “Sort” instead of opening a second panel or scrollbar.
- Reorder with a dedicated drag handle, plus move-up and move-down buttons for keyboard and touch use.
- Remove all uses an inline confirmation and then applies DSH's official per-item removal operation sequentially.
- Bulk removal only targets messages visible when it is confirmed, so messages queued afterward are not removed.
- Show the server-confirmed order immediately, then reconcile it with DSH's authoritative queue snapshot.
- Compare-and-swap protection rejects stale browser actions instead of mutating a queue that has already changed.
- DSH-native spacing, colors, icons, Chinese and English UI copy, visible focus, screen-reader announcements, and 44px coarse-pointer targets.

## Install

The recommended path is the prebuilt Release archive, which needs no install-script permission:

```bash
dsh plugin --profile web add -w https://github.com/starslittle/dsh-queue-plus/releases/download/v0.2.0/dsh-queue-plus-0.2.0.tgz
```

Restart `dsh web`. Queue at least two prompts while an agent is running; “Sort” appears in the queue header and reorders the existing list in place.

You can also pin a version and install from GitHub source:

```bash
dsh plugin --profile web add github:starslittle/dsh-queue-plus#v0.2.0
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
- The browser renders one queue surface; sorting reuses the authoritative rows instead of copying business state.
- Single and bulk removal both use DSH's official `conversation.updateQueue(..., { kind: 'remove' })`; bulk removal is not atomic and can partially complete if the queue changes concurrently.
- The plugin does not touch steering/context queues or queues owned by a parent Agent.
- The browser uses a same-origin `application/json` POST route only for reordering; responses disable caching and request bodies are capped.

## Compatibility

Built against the public `@deepseek-ai/* 0.1.0-rc.6` Agent Inbox and Web plugin contracts. Those contracts are still release candidates; a future DSH contract change may require a plugin update.

Build output is in `lib/`: `lib/index.js` for the Host and `lib/client.js` for the browser.

The consumer-side `prepare` build stays entirely inside this repository and does not depend on a neighboring DSH source checkout.

## License

MIT
