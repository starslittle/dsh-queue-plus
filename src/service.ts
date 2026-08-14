import { randomUUID } from 'node:crypto'
import type { Agent, InboxTarget } from '@deepseek-ai/dsh-agent'
import type { UserMessage } from '@deepseek-ai/dsh-llm'
import {
  QUEUE_PLUS_MAX_ITEMS,
  QUEUE_PLUS_UNDO_WINDOW_MS,
  type QueueClearRequest,
  type QueueMoveRequest,
  type QueuePlusRequest,
  type QueuePlusResult,
  type QueueUndoRequest,
} from './shared'

/** Typed failure translated to a narrow HTTP response by the host entry. */
export class QueuePlusError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'QueuePlusError'
  }
}

interface UndoRecord {
  readonly sessionId: string
  readonly agent: Agent
  readonly messages: UserMessage[]
  readonly expiresAt: number
  inFlight: boolean
}

export interface QueuePlusServiceOptions {
  resolveAgent(sessionId: string): Agent | undefined
  now?: () => number
  token?: () => string
  undoWindowMs?: number
}

function stringField(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 256) {
    throw new QueuePlusError(400, 'BAD_REQUEST', `${name} must be a non-empty string`)
  }
  return value
}

function objectField(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new QueuePlusError(400, 'BAD_REQUEST', 'request body must be an object')
  }
  return value as Record<string, unknown>
}

function orderField(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > QUEUE_PLUS_MAX_ITEMS) {
    throw new QueuePlusError(400, 'BAD_REQUEST', 'expectedOrder must be a non-empty bounded array')
  }
  const order = value.map((item, index) => stringField(item, `expectedOrder[${String(index)}]`))
  if (new Set(order).size !== order.length) {
    throw new QueuePlusError(400, 'BAD_REQUEST', 'expectedOrder contains duplicate ids')
  }
  return order
}

/** Decode the untrusted JSON body before it reaches the queue mutation layer. */
export function decodeQueuePlusRequest(value: unknown): QueuePlusRequest {
  const row = objectField(value)
  const action = stringField(row['action'], 'action')
  const sessionId = stringField(row['sessionId'], 'sessionId')
  if (action === 'move') {
    const toIndex = row['toIndex']
    if (!Number.isSafeInteger(toIndex) || (toIndex as number) < 0) {
      throw new QueuePlusError(400, 'BAD_REQUEST', 'toIndex must be a non-negative integer')
    }
    return {
      action,
      sessionId,
      itemId: stringField(row['itemId'], 'itemId'),
      toIndex: toIndex as number,
      expectedOrder: orderField(row['expectedOrder']),
    }
  }
  if (action === 'clear') {
    return { action, sessionId, expectedOrder: orderField(row['expectedOrder']) }
  }
  if (action === 'undo') {
    return { action, sessionId, token: stringField(row['token'], 'token') }
  }
  throw new QueuePlusError(400, 'BAD_REQUEST', `unknown action "${action}"`)
}

function ids(messages: readonly UserMessage[]): string[] {
  return messages.map(message => String(message.id))
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function ordinary(agent: Agent): void {
  if (agent.session.header.origin === 'subagent') {
    throw new QueuePlusError(409, 'SUBAGENT_UNSUPPORTED', 'subagent queues are owned by their parent')
  }
}

/** Host-only queue transaction service. Every operation re-reads live state. */
export class QueuePlusService {
  private readonly undos = new Map<string, UndoRecord>()
  private readonly sessionTokens = new Map<string, string>()
  private readonly now: () => number
  private readonly token: () => string
  private readonly undoWindowMs: number

  constructor(private readonly options: QueuePlusServiceOptions) {
    this.now = options.now ?? Date.now
    this.token = options.token ?? randomUUID
    this.undoWindowMs = options.undoWindowMs ?? QUEUE_PLUS_UNDO_WINDOW_MS
  }

  async execute(request: QueuePlusRequest): Promise<QueuePlusResult> {
    // Keep the requested undo record long enough to report an explicit 410.
    // Other stale records can be discarded opportunistically.
    this.prune(request.action === 'undo' ? request.token : undefined)
    switch (request.action) {
      case 'move':
        return this.move(request)
      case 'clear':
        return this.clear(request)
      case 'undo':
        return await this.undo(request)
    }
  }

  private agentFor(sessionId: string): Agent {
    const agent = this.options.resolveAgent(sessionId)
    if (agent === undefined) {
      throw new QueuePlusError(404, 'AGENT_NOT_FOUND', 'the session no longer has a live agent')
    }
    ordinary(agent)
    return agent
  }

  private assertExpected(agent: Agent, expectedOrder: readonly string[]): UserMessage[] {
    const current = [...agent.inbox.nextTurn]
    if (!sameOrder(ids(current), expectedOrder)) {
      throw new QueuePlusError(409, 'QUEUE_CHANGED', 'the queue changed before this operation; retry from the latest order')
    }
    return current
  }

  private move(request: QueueMoveRequest): QueuePlusResult {
    const agent = this.agentFor(request.sessionId)
    const current = this.assertExpected(agent, request.expectedOrder)
    if (request.toIndex >= current.length) {
      throw new QueuePlusError(400, 'INVALID_TARGET', 'the target position is outside the current queue')
    }
    const fromIndex = current.findIndex(message => String(message.id) === request.itemId)
    if (fromIndex < 0) {
      throw new QueuePlusError(409, 'ITEM_NOT_FOUND', 'the queued item is no longer pending')
    }
    if (fromIndex === request.toIndex) {
      return { ok: true, action: 'move', order: ids(current) }
    }

    const start = Math.min(fromIndex, request.toIndex)
    const end = Math.max(fromIndex, request.toIndex)
    const replacement = current.slice(start, end + 1)
    const relativeFrom = fromIndex - start
    const relativeTo = request.toIndex - start
    const [moving] = replacement.splice(relativeFrom, 1)
    if (moving === undefined) throw new QueuePlusError(409, 'ITEM_NOT_FOUND', 'the queued item is no longer pending')
    replacement.splice(relativeTo, 0, moving)

    // One replacement splice is important: observers see only the final order,
    // and core accounting treats a non-empty replacement as still-pending work.
    agent.inbox.splice('next-turn', start, end - start + 1, replacement)
    return { ok: true, action: 'move', order: ids(agent.inbox.nextTurn) }
  }

  private clear(request: QueueClearRequest): QueuePlusResult {
    const agent = this.agentFor(request.sessionId)
    const current = this.assertExpected(agent, request.expectedOrder)
    if (current.length === 0) throw new QueuePlusError(409, 'EMPTY_QUEUE', 'the queue is already empty')

    const removed = agent.inbox.splice('next-turn', 0, current.length, [])
    const token = this.token()
    const expiresAt = this.now() + this.undoWindowMs
    const previous = this.sessionTokens.get(request.sessionId)
    if (previous !== undefined) this.undos.delete(previous)
    this.undos.set(token, {
      sessionId: request.sessionId,
      agent,
      messages: removed,
      expiresAt,
      inFlight: false,
    })
    this.sessionTokens.set(request.sessionId, token)
    this.boundUndoLedger()
    return {
      ok: true,
      action: 'clear',
      count: removed.length,
      token,
      expiresAt,
      undoWindowMs: this.undoWindowMs,
    }
  }

  private async undo(request: QueueUndoRequest): Promise<QueuePlusResult> {
    const record = this.undos.get(request.token)
    if (record === undefined || record.sessionId !== request.sessionId) {
      throw new QueuePlusError(404, 'UNDO_NOT_FOUND', 'this clear operation can no longer be undone')
    }
    if (this.now() >= record.expiresAt) {
      this.deleteUndo(request.token, record)
      throw new QueuePlusError(410, 'UNDO_EXPIRED', 'the undo window has expired')
    }
    if (record.inFlight) throw new QueuePlusError(409, 'UNDO_IN_PROGRESS', 'undo is already in progress')

    const agent = this.agentFor(request.sessionId)
    if (agent !== record.agent) {
      throw new QueuePlusError(409, 'AGENT_CHANGED', 'the live agent changed after the queue was cleared')
    }
    this.assertRestorable(agent, record.messages)
    record.inFlight = true
    try {
      if (agent.status === 'idle') {
        await agent.runMaintenance(async () => {
          this.assertRestorable(agent, record.messages)
          const [first, ...rest] = record.messages
          if (first === undefined) return

          // Sending inside maintenance latches a wake without allowing the
          // driver to claim synchronously. Rebuild once afterward so restored
          // messages lead any work that arrived during the undo window.
          agent.send(first, 'next-turn' satisfies InboxTarget, true)
          const live = [...agent.inbox.nextTurn]
          const firstIndex = live.findIndex(message => message.id === first.id)
          if (firstIndex < 0) throw new QueuePlusError(409, 'UNDO_CONFLICT', 'the restored wake item changed unexpectedly')
          const baseline = live.toSpliced(firstIndex, 1)
          agent.inbox.splice('next-turn', 0, live.length, [first, ...rest, ...baseline])
        })
      } else {
        agent.inbox.splice('next-turn', 0, 0, [...record.messages])
      }
      this.deleteUndo(request.token, record)
      return { ok: true, action: 'undo', restored: record.messages.length }
    } catch (error: unknown) {
      record.inFlight = false
      throw error
    }
  }

  private assertRestorable(agent: Agent, messages: readonly UserMessage[]): void {
    const pending = new Set([...ids(agent.inbox.nextTurn), ...ids(agent.inbox.nextStep)])
    if (messages.some(message => pending.has(String(message.id)))) {
      throw new QueuePlusError(409, 'UNDO_CONFLICT', 'one or more cleared messages are already pending')
    }
  }

  private deleteUndo(token: string, record: UndoRecord): void {
    this.undos.delete(token)
    if (this.sessionTokens.get(record.sessionId) === token) this.sessionTokens.delete(record.sessionId)
  }

  private prune(preserveToken?: string): void {
    const now = this.now()
    for (const [token, record] of this.undos) {
      if (token !== preserveToken && !record.inFlight && now >= record.expiresAt) {
        this.deleteUndo(token, record)
      }
    }
  }

  private boundUndoLedger(): void {
    while (this.undos.size > 64) {
      const oldest = this.undos.entries().next().value as [string, UndoRecord] | undefined
      if (oldest === undefined) break
      this.deleteUndo(oldest[0], oldest[1])
    }
  }
}
