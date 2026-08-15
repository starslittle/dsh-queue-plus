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
}

function fakeAgent(messages: string[], origin?: 'subagent'): FakeAgentControl {
  const inbox = new FakeInbox(messages)
  const agent = {
    id: 'session-1',
    options: {},
    session: { header: { id: 'session-1', ...(origin === undefined ? {} : { origin }) } },
    inbox,
  } as unknown as Agent
  return { agent, inbox }
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

  it('refuses subagent ownership', async () => {
    const child = fakeAgent(['x', 'y'], 'subagent')
    const guarded = new QueuePlusService({ resolveAgent: () => child.agent })
    await expect(guarded.execute({
      action: 'move', sessionId: 'session-1', itemId: 'y', toIndex: 0,
      expectedOrder: ['x', 'y'],
    })).rejects.toMatchObject({ code: 'SUBAGENT_UNSUPPORTED' })
  })
})

describe('decodeQueuePlusRequest', () => {
  it('accepts only the narrow move shape', () => {
    expect(decodeQueuePlusRequest({
      action: 'move', sessionId: 's', itemId: 'b', toIndex: 0, expectedOrder: ['a', 'b'],
    })).toEqual({ action: 'move', sessionId: 's', itemId: 'b', toIndex: 0, expectedOrder: ['a', 'b'] })
    expect(() => decodeQueuePlusRequest({
      action: 'move', sessionId: 's', itemId: 'b', toIndex: 0, expectedOrder: ['a', 'a'],
    })).toThrowError(QueuePlusError)
    expect(() => decodeQueuePlusRequest({
      action: 'clear', sessionId: 's', expectedOrder: ['a', 'b'],
    })).toThrowError(QueuePlusError)
  })
})
