import type { Agent, InboxTarget } from '@deepseek-ai/dsh-agent'
import type { UserMessage } from '@deepseek-ai/dsh-llm'
import { describe, expect, it } from 'vitest'
import { decodeQueuePlusRequest, QueuePlusError, QueuePlusService } from '../src/service'

function message(id: string): UserMessage {
  return {
    id,
    role: 'user',
    content: [{ type: 'text', text: id }],
    source: { kind: 'user' },
  } as UserMessage
}

class FakeInbox {
  nextTurn: UserMessage[]
  nextStep: UserMessage[] = []
  readonly splices: Array<{ target: InboxTarget; start: number; deleteCount: number; inserted: string[] }> = []

  constructor(messages: string[]) {
    this.nextTurn = messages.map(message)
  }

  splice(target: InboxTarget, start: number, deleteCount: number, inserted: UserMessage[]): UserMessage[] {
    this.splices.push({ target, start, deleteCount, inserted: inserted.map(item => String(item.id)) })
    const list = target === 'next-turn' ? this.nextTurn : this.nextStep
    return list.splice(start, deleteCount, ...inserted)
  }
}

interface FakeAgentControl {
  readonly agent: Agent
  readonly inbox: FakeInbox
  readonly wakes: { count: number }
  setStatus(status: 'idle' | 'running'): void
}

function fakeAgent(messages: string[], origin?: 'subagent'): FakeAgentControl {
  const inbox = new FakeInbox(messages)
  const wakes = { count: 0 }
  let status: 'idle' | 'running' = 'running'
  let maintenance = false
  let wakeLatched = false
  const agent = {
    id: 'session-1',
    options: {},
    session: { header: { id: 'session-1', ...(origin === undefined ? {} : { origin }) } },
    inbox,
    get status() { return status },
    send(item: UserMessage, target: InboxTarget, wakeup: boolean) {
      inbox.splice(target, target === 'next-turn' ? inbox.nextTurn.length : inbox.nextStep.length, 0, [item])
      if (!wakeup) return
      wakes.count += 1
      if (maintenance) wakeLatched = true
      else status = 'running'
    },
    followup() {},
    steer() {},
    inject() {},
    cancel() {},
    async runMaintenance<T>(job: (signal: AbortSignal) => Promise<T>): Promise<T> {
      if (status !== 'idle') throw new Error('not idle')
      maintenance = true
      try {
        return await job(new AbortController().signal)
      } finally {
        maintenance = false
        if (wakeLatched && inbox.nextTurn.length > 0) status = 'running'
      }
    },
    whenIdle: () => Promise.resolve(),
    ctx: {},
  } as unknown as Agent
  return { agent, inbox, wakes, setStatus(next) { status = next } }
}

function ids(inbox: FakeInbox): string[] {
  return inbox.nextTurn.map(item => String(item.id))
}

describe('QueuePlusService', () => {
  it('moves one item with a single atomic contiguous replacement', async () => {
    const fixture = fakeAgent(['a', 'b', 'c', 'd'])
    const service = new QueuePlusService({ resolveAgent: () => fixture.agent })

    const result = await service.execute({
      action: 'move', sessionId: 'session-1', itemId: 'a', toIndex: 2,
      expectedOrder: ['a', 'b', 'c', 'd'],
    })

    expect(result).toEqual({ ok: true, action: 'move', order: ['b', 'c', 'a', 'd'] })
    expect(fixture.inbox.splices).toEqual([
      { target: 'next-turn', start: 0, deleteCount: 3, inserted: ['b', 'c', 'a'] },
    ])
  })

  it('rejects a stale browser order without mutating live state', async () => {
    const fixture = fakeAgent(['a', 'b', 'c'])
    const service = new QueuePlusService({ resolveAgent: () => fixture.agent })

    await expect(service.execute({
      action: 'move', sessionId: 'session-1', itemId: 'c', toIndex: 0,
      expectedOrder: ['a', 'c', 'b'],
    })).rejects.toMatchObject({ code: 'QUEUE_CHANGED', status: 409 })
    expect(ids(fixture.inbox)).toEqual(['a', 'b', 'c'])
    expect(fixture.inbox.splices).toHaveLength(0)
  })

  it('clears and restores before newer work while the agent is running', async () => {
    const fixture = fakeAgent(['a', 'b'])
    const service = new QueuePlusService({
      resolveAgent: () => fixture.agent,
      token: () => 'undo-1',
      now: () => 1_000,
    })
    const cleared = await service.execute({
      action: 'clear', sessionId: 'session-1', expectedOrder: ['a', 'b'],
    })
    expect(cleared).toMatchObject({ action: 'clear', token: 'undo-1', count: 2 })
    fixture.inbox.splice('next-turn', 0, 0, [message('c')])

    await service.execute({ action: 'undo', sessionId: 'session-1', token: 'undo-1' })
    expect(ids(fixture.inbox)).toEqual(['a', 'b', 'c'])
    await expect(service.execute({ action: 'undo', sessionId: 'session-1', token: 'undo-1' }))
      .rejects.toMatchObject({ code: 'UNDO_NOT_FOUND' })
  })

  it('uses the maintenance wake latch when restoring into an idle agent', async () => {
    const fixture = fakeAgent(['a', 'b'])
    const service = new QueuePlusService({
      resolveAgent: () => fixture.agent,
      token: () => 'undo-idle',
      now: () => 1_000,
    })
    await service.execute({ action: 'clear', sessionId: 'session-1', expectedOrder: ['a', 'b'] })
    fixture.setStatus('idle')
    fixture.inbox.splice('next-turn', 0, 0, [message('c')])

    await service.execute({ action: 'undo', sessionId: 'session-1', token: 'undo-idle' })
    expect(ids(fixture.inbox)).toEqual(['a', 'b', 'c'])
    expect(fixture.wakes.count).toBe(1)
    expect(fixture.agent.status).toBe('running')
  })

  it('expires undo records and refuses subagent ownership', async () => {
    let now = 1_000
    const fixture = fakeAgent(['a', 'b'])
    const service = new QueuePlusService({
      resolveAgent: () => fixture.agent,
      token: () => 'undo-expired',
      now: () => now,
      undoWindowMs: 10,
    })
    await service.execute({ action: 'clear', sessionId: 'session-1', expectedOrder: ['a', 'b'] })
    now = 1_011
    await expect(service.execute({ action: 'undo', sessionId: 'session-1', token: 'undo-expired' }))
      .rejects.toMatchObject({ code: 'UNDO_EXPIRED', status: 410 })

    const child = fakeAgent(['x', 'y'], 'subagent')
    const guarded = new QueuePlusService({ resolveAgent: () => child.agent })
    await expect(guarded.execute({
      action: 'move', sessionId: 'session-1', itemId: 'y', toIndex: 0,
      expectedOrder: ['x', 'y'],
    })).rejects.toMatchObject({ code: 'SUBAGENT_UNSUPPORTED' })
  })
})

describe('decodeQueuePlusRequest', () => {
  it('accepts the narrow move shape and rejects duplicate snapshots', () => {
    expect(decodeQueuePlusRequest({
      action: 'move', sessionId: 's', itemId: 'b', toIndex: 0, expectedOrder: ['a', 'b'],
    })).toEqual({ action: 'move', sessionId: 's', itemId: 'b', toIndex: 0, expectedOrder: ['a', 'b'] })
    expect(() => decodeQueuePlusRequest({
      action: 'clear', sessionId: 's', expectedOrder: ['a', 'a'],
    })).toThrowError(QueuePlusError)
  })
})
