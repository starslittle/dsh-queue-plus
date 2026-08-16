import {
  QUEUE_PLUS_PATH,
  type QueueMoveRequest,
  type QueueMoveResult,
  type QueuePlusErrorBody,
  type QueuePlusRequest,
  type QueuePlusResult,
} from '../shared'

export class QueuePlusClientError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'QueuePlusClientError'
  }
}

async function call(request: QueuePlusRequest): Promise<QueuePlusResult> {
  const response = await fetch(QUEUE_PLUS_PATH, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify(request),
  })
  const value = await response.json() as QueuePlusResult | QueuePlusErrorBody
  if (!response.ok || value.ok !== true) {
    const failure = value as QueuePlusErrorBody
    throw new QueuePlusClientError(
      failure.error?.code ?? `HTTP_${String(response.status)}`,
      failure.error?.message ?? 'queue operation failed',
    )
  }
  return value
}

export async function moveQueue(request: QueueMoveRequest): Promise<QueueMoveResult> {
  const result = await call(request)
  if (result.action !== 'move') throw new QueuePlusClientError('BAD_RESPONSE', 'unexpected queue response')
  return result
}
