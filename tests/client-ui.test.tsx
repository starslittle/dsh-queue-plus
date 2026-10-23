import type { InboxState } from '@deepseek-ai/dsh-agent/types'
import type { PendingSubmission } from '@deepseek-ai/dsh-api-session-controller/client'
import type { UserMessage } from '@deepseek-ai/dsh-llm'
import { act, createElement, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  IconCheckOutlineRegular: () => null,
  IconChevronDownOutlineRegular: () => null,
  IconChevronUpOutlineRegular: () => null,
  IconCloseOutlineRegular: () => null,
  IconEditOutlineRegular: () => null,
  IconQueueOutlineRegular: () => null,
  IconSendOutlineRegular: () => null,
  IconTrashOutlineRegular: () => null,
  Tooltip: ({ children }: { children: ReactNode }) => children,
}))

import { QueuePlusDock, type QueuePlusDockProps } from '../src/client/QueuePlusDock'
import { zh } from '../src/client/locales'

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mounted: Array<() => void> = []

afterEach(() => {
  for (const dispose of mounted.splice(0).reverse()) dispose()
})

function row(id: string, preview: string, rpcId?: string): UserMessage {
  return {
    id,
    role: 'user',
    content: [{ type: 'text', text: preview }],
    source: rpcId === undefined ? { kind: 'user' } : { kind: 'user', rpcId },
  } as unknown as UserMessage
}

interface HarnessState {
  inbox: InboxState
  pendingSubmissions: readonly PendingSubmission[]
  running: boolean
  subagent: { address: { mode: 'one-shot' | 'continuable' | 'unknown' } } | null
}

function translate(key: string, params: Record<string, unknown> = {}): string {
  const template = zh[key as keyof typeof zh] ?? key
  let text: string = template
  for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value))
  return text
}

async function renderQueue(rows: readonly UserMessage[], pendingSubmissions: readonly PendingSubmission[] = []) {
  let state: HarnessState = {
    inbox: { 'next-turn': rows, 'next-step': [] },
    pendingSubmissions,
    running: true,
    subagent: null,
  }
  const updateQueue = vi.fn(async () => undefined)
  const props = {
    sessionId: 'session-1',
    useProjection: (key: string) => key === 'inbox' ? state.inbox : undefined,
    useSession: <T,>(selector: (value: HarnessState) => T): T => selector(state),
    updateQueue,
    t: translate,
  } as unknown as QueuePlusDockProps
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push(() => {
    act(() => root.unmount())
    container.remove()
  })
  const render = async (): Promise<void> => {
    await act(async () => root.render(createElement(QueuePlusDock, props)))
  }
  await render()
  return {
    container,
    updateQueue,
    rerenderQueue: async (nextRows: readonly UserMessage[]): Promise<void> => {
      state = { ...state, inbox: { 'next-turn': nextRows, 'next-step': [] } }
      await render()
    },
  }
}

function buttonWithText(container: ParentNode, text: string): HTMLButtonElement {
  const button = [...container.querySelectorAll('button')].find(item => item.textContent === text)
  if (!(button instanceof HTMLButtonElement)) throw new Error(`button "${text}" not found`)
  return button
}

describe('unified queue dock', () => {
  it('uses one list and switches that list between management and sorting', async () => {
    const { container } = await renderQueue([row('a', '你好'), row('b', '下一条')])

    expect(container.textContent?.match(/2 条排队消息/g)).toHaveLength(1)
    expect(container.querySelectorAll('ol')).toHaveLength(1)
    expect(container.querySelector('[data-queue-plus-mode="manage"]')).not.toBeNull()

    await act(async () => buttonWithText(container, '排序').click())

    expect(container.querySelector('[data-queue-plus-mode="sort"]')).not.toBeNull()
    expect(container.querySelectorAll('ol')).toHaveLength(1)
    expect(container.textContent?.match(/你好/g)).toHaveLength(1)
    expect(container.textContent?.match(/下一条/g)).toHaveLength(1)
    expect(container.textContent).toContain('01')
    expect(container.textContent).toContain('02')
    expect(container.querySelectorAll('[aria-label="编辑消息"]')).toHaveLength(0)

    await act(async () => buttonWithText(container, '完成').click())

    expect(container.querySelector('[data-queue-plus-mode="manage"]')).not.toBeNull()
    expect(container.querySelectorAll('ol')).toHaveLength(1)
    expect(container.querySelectorAll('[aria-label="编辑消息"]')).toHaveLength(2)
  })

  it('expands a new queue automatically and remembers a manual collapse until the queue clears', async () => {
    const first = row('a', '第一条')
    const second = row('b', '第二条')
    const { container, rerenderQueue } = await renderQueue([first, second])

    expect(container.querySelectorAll('ol')).toHaveLength(1)
    await act(async () => buttonWithText(container, '2 条排队消息').click())
    expect(container.querySelectorAll('ol')).toHaveLength(0)

    await rerenderQueue([first, second, row('c', '第三条')])
    expect(container.querySelectorAll('ol')).toHaveLength(0)

    await rerenderQueue([])
    expect(container.querySelector('[data-queue-plus-dock]')).toBeNull()

    await rerenderQueue([row('d', '新第一条'), row('e', '新第二条')])
    expect(container.querySelectorAll('ol')).toHaveLength(1)
  })

  it('keeps a single queued message compact and does not offer sorting', async () => {
    const { container } = await renderQueue([row('a', '只有一条')])

    expect(container.querySelectorAll('ol')).toHaveLength(1)
    expect(container.textContent).toContain('只有一条')
    expect([...container.querySelectorAll('button')].some(button => button.textContent === '排序')).toBe(false)
  })

  it('asks for an inline confirmation before removing one message', async () => {
    const { container, updateQueue } = await renderQueue([row('a', '待确认删除')])

    const remove = container.querySelector('[aria-label="删除消息"]')
    if (!(remove instanceof HTMLButtonElement)) throw new Error('remove button not found')
    await act(async () => remove.click())

    expect(updateQueue).not.toHaveBeenCalled()
    expect(buttonWithText(container, '确认删除').disabled).toBe(false)

    await act(async () => buttonWithText(container, '确认删除').click())

    expect(updateQueue).toHaveBeenCalledWith('a', { kind: 'remove' })
  })

  it('keeps a removal confirmation open until the user decides', async () => {
    vi.useFakeTimers()
    try {
      const { container } = await renderQueue([row('a', '待确认删除')])
      const remove = container.querySelector('[aria-label="删除消息"]')
      if (!(remove instanceof HTMLButtonElement)) throw new Error('remove button not found')

      await act(async () => remove.click())
      act(() => vi.advanceTimersByTime(6_000))

      expect(buttonWithText(container, '确认删除').disabled).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps remove-all confirmation open unless the queue changes', async () => {
    vi.useFakeTimers()
    try {
      const first = row('a', '第一条')
      const second = row('b', '第二条')
      const { container, rerenderQueue } = await renderQueue([first, second])

      await act(async () => buttonWithText(container, '删除全部').click())
      act(() => vi.advanceTimersByTime(6_000))
      expect(container.textContent).toContain('确认删除 2 条排队消息？')

      await rerenderQueue([first, second, row('c', '新加入')])
      expect(container.textContent).not.toContain('确认删除 3 条排队消息？')
      expect(buttonWithText(container, '删除全部').disabled).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps destructive actions out of the sorting workspace', async () => {
    const { container } = await renderQueue([row('a', '第一条'), row('b', '第二条')])

    await act(async () => buttonWithText(container, '排序').click())

    expect(container.textContent).toContain('拖动六点手柄，或使用上下箭头')
    expect([...container.querySelectorAll('button')].some(button => button.textContent === '删除全部')).toBe(false)
  })

  it('confirms remove-all and delegates every click-time row to the official queue action', async () => {
    const { container, updateQueue } = await renderQueue([row('a', '第一条'), row('b', '第二条')])

    await act(async () => buttonWithText(container, '删除全部').click())

    expect(updateQueue).not.toHaveBeenCalled()
    expect(container.textContent).toContain('确认删除 2 条排队消息？')

    await act(async () => buttonWithText(container, '确认删除').click())

    expect(updateQueue).toHaveBeenCalledTimes(2)
    expect(updateQueue).toHaveBeenNthCalledWith(1, 'a', { kind: 'remove' })
    expect(updateQueue).toHaveBeenNthCalledWith(2, 'b', { kind: 'remove' })
  })

  it('continues official removals when one click-time row has already changed state', async () => {
    const { container, updateQueue } = await renderQueue([
      row('a', '第一条'), row('b', '第二条'), row('c', '第三条'),
    ])
    updateQueue.mockRejectedValueOnce(new Error('already claimed'))

    await act(async () => buttonWithText(container, '删除全部').click())
    await act(async () => buttonWithText(container, '确认删除').click())

    expect(updateQueue).toHaveBeenCalledTimes(3)
    expect(container.textContent).toContain('已删除 2/3 条，其余消息状态已变化。')
  })

  it('renders inbox rows that have no placement field', async () => {
    const { container } = await renderQueue([row('a', '没有 placement'), row('b', '第二条真实排队')])

    expect(container.textContent).toContain('没有 placement')
    expect(container.textContent).toContain('第二条真实排队')
    expect(container.textContent).toContain('2 条排队消息')
  })

  it('shows a queued submission echo until the inbox admits it', async () => {
    const echo = {
      requestId: 'rpc-1',
      placement: 'queued',
      time: 1,
      text: '还在发送',
      attachments: [],
    } as unknown as PendingSubmission
    const { container } = await renderQueue([row('a', '已经入库', 'rpc-2')], [echo])

    expect(container.textContent).toContain('已经入库')
    expect(container.textContent).toContain('还在发送')
    expect(container.textContent).toContain('发送中')
    expect(container.querySelectorAll('[aria-label="编辑消息"]')).toHaveLength(1)
  })

  it('hides an inbox row already shown in the transcript', async () => {
    const transcript = {
      requestId: 'rpc-1',
      placement: 'transcript',
      time: 1,
      text: '已经进入对话',
      attachments: [],
    } as unknown as PendingSubmission
    const { container } = await renderQueue([
      row('a', '不该出现在队列', 'rpc-1'),
      row('b', '仍在排队'),
    ], [transcript])

    expect(container.textContent).not.toContain('不该出现在队列')
    expect(container.textContent).toContain('仍在排队')
    expect([...container.querySelectorAll('button')].some(button => button.textContent === '排序')).toBe(false)
  })
})
