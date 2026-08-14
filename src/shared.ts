/** Same-origin endpoint owned by the Queue Plus host plugin. */
export const QUEUE_PLUS_PATH = '/queue-plus'

/** How long a clear-all operation can be undone in the same host process. */
export const QUEUE_PLUS_UNDO_WINDOW_MS = 10_000

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

export interface QueueClearRequest {
  action: 'clear'
  sessionId: string
  /** Exact browser snapshot used as a compare-and-swap precondition. */
  expectedOrder: string[]
}

export interface QueueUndoRequest {
  action: 'undo'
  sessionId: string
  token: string
}

export type QueuePlusRequest = QueueMoveRequest | QueueClearRequest | QueueUndoRequest

export interface QueueMoveResult {
  ok: true
  action: 'move'
  order: string[]
}

export interface QueueClearResult {
  ok: true
  action: 'clear'
  count: number
  token: string
  expiresAt: number
  undoWindowMs: number
}

export interface QueueUndoResult {
  ok: true
  action: 'undo'
  restored: number
}

export type QueuePlusResult = QueueMoveResult | QueueClearResult | QueueUndoResult

export interface QueuePlusErrorBody {
  ok: false
  error: {
    code: string
    message: string
  }
}
