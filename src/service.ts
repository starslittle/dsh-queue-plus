import type { Agent } from '@deepseek-ai/dsh-agent'
import type { UserMessage } from '@deepseek-ai/dsh-llm'
import {
  QUEUE_PLUS_MAX_ITEMS,
  type QueueMoveRequest,
  type QueuePlusRequest,
  type QueuePlusResult,
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

export interface QueuePlusServiceOptions {
  resolveAgent(sessionId: string): Agent | undefined
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
  constructor(private readonly options: QueuePlusServiceOptions) {}

  async execute(request: QueuePlusRequest): Promise<QueuePlusResult> {
    return this.move(request)
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

}
