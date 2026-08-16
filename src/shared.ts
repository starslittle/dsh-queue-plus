/** Same-origin endpoint owned by the Queue Plus host plugin. */
export const QUEUE_PLUS_PATH = '/queue-plus'

/** Defensive ceiling for one mutation request and one rendered management list. */
export const QUEUE_PLUS_MAX_ITEMS = 200

export interface QueueMoveRequest {
  action: 'move'
  sessionId: string
  itemId: string
  toIndex: number
  /** Exact browser snapshot used as a compare-and-swap precondition. */
  expectedOrder: string[]
}

export type QueuePlusRequest = QueueMoveRequest

export interface QueueMoveResult {
  ok: true
  action: 'move'
  order: string[]
}

export type QueuePlusResult = QueueMoveResult

export interface QueuePlusErrorBody {
  ok: false
  error: {
    code: string
    message: string
  }
}
