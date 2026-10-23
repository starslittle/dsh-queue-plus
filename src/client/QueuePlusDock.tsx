import type { InboxState } from '@deepseek-ai/dsh-agent/types'
import type { PendingSubmission } from '@deepseek-ai/dsh-api-session-controller/client'
import type { QueueAction } from '@deepseek-ai/dsh-api-session-controller/types'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import {
  IconCheckOutlineRegular,
  IconChevronDownOutlineRegular,
  IconChevronUpOutlineRegular,
  IconCloseOutlineRegular,
  IconEditOutlineRegular,
  IconQueueOutlineRegular,
  IconSendOutlineRegular,
  IconTrashOutlineRegular,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ContentBlock, MessageId, UserMessage } from '@deepseek-ai/dsh-llm'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { moveQueue, QueuePlusClientError } from './api'
import { NS } from './locales'
import { styles } from './styles'

type QueueItemId = MessageId

export interface QueuePlusDockInjected {
  updateQueue(itemId: QueueItemId, action: QueueAction): Promise<void>
}

export type QueuePlusDockProps = PropsRuntime<'conversation.input.dock'>
  & PropsLocale<typeof NS>
  & QueuePlusDockInjected

interface EditingState {
  readonly id: QueueItemId
  readonly text: string
}

interface Notice {
  readonly level: 'info' | 'error'
  readonly text: string
}

interface Announcement {
  readonly key: number
  readonly text: string
}

type BusyAction = 'queue' | 'move' | 'clear'

interface DurableRow {
  readonly pending: false
  readonly id: MessageId
  readonly key: string
  readonly preview: string
  readonly text: string | null
}

interface EchoRow {
  readonly pending: true
  readonly key: string
  readonly preview: string
}

type QueueRow = DurableRow | EchoRow

const EMPTY_QUEUE = [] as const

function rpcId(source: UserMessage['source']): string | undefined {
  if (source.kind !== 'user' || !('rpcId' in source)) return undefined
  const value = source.rpcId
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function rowText(content: readonly ContentBlock[]): { editable: string | null; plain: string } {
  let editable = ''
  let plain = ''
  let textOnly = true
  for (const block of content) {
    if (block.type !== 'text') {
      textOnly = false
      continue
    }
    editable += block.text
    plain += block.text
  }
  return { editable: textOnly ? editable : null, plain: plain.trim() }
}

function durableRows(inbox: InboxState | undefined, pending: readonly PendingSubmission[], attachmentLabel: string): DurableRow[] {
  const rows = inbox?.['next-turn'] ?? EMPTY_QUEUE
  const inChat = new Set(pending.filter(item => item.placement === 'transcript').map(item => String(item.requestId)))
  const visible = inChat.size === 0 ? rows : rows.filter(row => {
    const id = rpcId(row.source)
    return id === undefined || !inChat.has(id)
  })
  return visible.map(row => {
    const text = rowText(row.content)
    return {
      pending: false,
      id: row.id,
      key: String(row.id),
      preview: text.plain !== '' ? text.plain : attachmentLabel,
      text: text.editable,
    }
  })
}

function echoRows(inbox: InboxState | undefined, pending: readonly PendingSubmission[], attachmentLabel: string): EchoRow[] {
  const admitted = new Set((inbox?.['next-turn'] ?? EMPTY_QUEUE).flatMap(row => {
    const id = rpcId(row.source)
    return id === undefined ? [] : [id]
  }))
  return pending.flatMap(submission => {
    if (submission.placement !== 'queued' || admitted.has(String(submission.requestId))) return []
    const plain = submission.text.trim()
    return [{
      pending: true as const,
      key: `pending:${String(submission.requestId)}`,
      preview: plain !== '' ? plain : attachmentLabel,
    }]
  })
}

function ids(rows: readonly DurableRow[]): string[] {
  return rows.map(row => row.key)
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && new Set(left).size === left.length
    && left.every(id => right.includes(id))
}

function projectOrder(rows: readonly DurableRow[], order: readonly string[] | null): DurableRow[] {
  if (order === null || !sameMembers(ids(rows), order)) return [...rows]
  const byId = new Map(rows.map(row => [row.key, row] as const))
  const projected = order.map(id => byId.get(id))
  return projected.every((row): row is DurableRow => row !== undefined) ? projected : [...rows]
}

function errorText(error: unknown, t: QueuePlusDockProps['t'], fallback?: string): string {
  if (error instanceof QueuePlusClientError) {
    if (['QUEUE_CHANGED', 'ITEM_NOT_FOUND', 'EMPTY_QUEUE', 'INVALID_TARGET'].includes(error.code)) {
      return t('error.queueChanged')
    }
  }
  return fallback ?? t('error.generic')
}

/** One queue surface with an in-place management/sorting mode switch. */
export function QueuePlusDock({
  useSession,
  useProjection,
  sessionId,
  updateQueue,
  t,
}: QueuePlusDockProps): React.JSX.Element | null {
  const inbox = useProjection('inbox') as unknown as InboxState | undefined
  const pendingSubmissions = useSession(snapshot => snapshot.pendingSubmissions)
  const attachmentLabel = t('row.attachmentOnly')
  const queue = useMemo(
    () => durableRows(inbox, pendingSubmissions, attachmentLabel),
    [attachmentLabel, inbox, pendingSubmissions],
  )
  const echoes = useMemo(
    () => echoRows(inbox, pendingSubmissions, attachmentLabel),
    [attachmentLabel, inbox, pendingSubmissions],
  )
  const running = useSession(snapshot => snapshot.running)
  const subagent = useSession(snapshot => snapshot.subagent)
  const queueMutable = subagent === null || subagent.address.mode === 'continuable'
  const sortable = subagent === null
  const [collapsed, setCollapsed] = useState(true)
  const [sorting, setSorting] = useState(false)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState<QueueItemId | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [busy, setBusy] = useState<BusyAction | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const listId = useId()
  const sortHintId = useId()
  const manuallyCollapsed = useRef(false)
  const previousQueueLength = useRef(0)
  const confirmingClearOrder = useRef<string[] | null>(null)

  const displayQueue = useMemo(() => projectOrder(queue, pendingOrder), [pendingOrder, queue])
  const visibleRows: readonly QueueRow[] = sorting ? displayQueue : [...displayQueue, ...echoes]
  const rowCount = displayQueue.length + echoes.length

  useEffect(() => {
    if (pendingOrder === null) return
    const liveOrder = ids(queue)
    if (sameOrder(liveOrder, pendingOrder) || !sameMembers(liveOrder, pendingOrder)) setPendingOrder(null)
  }, [pendingOrder, queue])

  useEffect(() => {
    const previousLength = previousQueueLength.current
    if (rowCount === 0) {
      setCollapsed(true)
      manuallyCollapsed.current = false
    } else if (!manuallyCollapsed.current && (previousLength === 0 || (previousLength === 1 && rowCount > 1))) {
      setCollapsed(false)
    }
    previousQueueLength.current = rowCount
    if (displayQueue.length < 2 || !sortable) {
      setSorting(false)
      setConfirmingClear(false)
      confirmingClearOrder.current = null
    }
    if (confirmingClear && (confirmingClearOrder.current === null
      || !sameOrder(ids(queue), confirmingClearOrder.current))) {
      setConfirmingClear(false)
      confirmingClearOrder.current = null
    }
    if (editing !== null && (!queueMutable || !queue.some(row => row.id === editing.id))) setEditing(null)
    if (confirmingRemove !== null
      && (!queueMutable || !queue.some(row => row.id === confirmingRemove))) setConfirmingRemove(null)
    if (dragging !== null && !queue.some(row => row.key === dragging)) setDragging(null)
    if (dragOver !== null && !queue.some(row => row.key === dragOver)) setDragOver(null)
  }, [confirmingClear, confirmingRemove, displayQueue.length, dragOver, dragging, editing, queue, queueMutable, rowCount, sortable])

  useEffect(() => {
    if (notice === null) return undefined
    const timer = window.setTimeout(() => setNotice(current => current === notice ? null : current), 4_000)
    return () => window.clearTimeout(timer)
  }, [notice])

  if (rowCount === 0 && notice === null) return null

  const interactionActive = busy !== null || editing !== null || confirmingRemove !== null || confirmingClear
  const listVisible = visibleRows.length === 1 || !collapsed || sorting || editing !== null
  const expectedOrder = (): string[] => ids(displayQueue)

  const announcePosition = (position: number): void => {
    setAnnouncement(current => ({
      key: (current?.key ?? 0) + 1,
      text: t('status.position', { position }),
    }))
  }

  const move = async (itemId: string, toIndex: number): Promise<void> => {
    if (busy !== null || toIndex < 0 || toIndex >= displayQueue.length) return
    const order = expectedOrder()
    if (order[toIndex] === itemId) return
    setBusy('move')
    setNotice(null)
    try {
      const result = await moveQueue({
        action: 'move',
        sessionId: String(sessionId),
        itemId,
        toIndex,
        expectedOrder: order,
      })
      setPendingOrder(result.order)
      announcePosition(toIndex + 1)
    } catch (error: unknown) {
      setPendingOrder(null)
      setNotice({ level: 'error', text: errorText(error, t) })
    } finally {
      setBusy(null)
      setDragging(null)
      setDragOver(null)
    }
  }

  const applyQueueAction = async (
    itemId: QueueItemId,
    action: QueueAction,
    failure: string,
  ): Promise<boolean> => {
    if (busy !== null) return false
    setBusy('queue')
    setNotice(null)
    try {
      await updateQueue(itemId, action)
      return true
    } catch (error: unknown) {
      setNotice({ level: 'error', text: errorText(error, t, failure) })
      return false
    } finally {
      setBusy(null)
    }
  }

  const saveEdit = async (): Promise<void> => {
    if (editing === null || editing.text.trim() === '') return
    if (await applyQueueAction(
      editing.id,
      { kind: 'edit', content: [{ type: 'text', text: editing.text }] },
      t('error.edit'),
    )) setEditing(null)
  }

  const removeMessage = async (itemId: QueueItemId): Promise<void> => {
    if (await applyQueueAction(itemId, { kind: 'remove' }, t('error.remove'))) setConfirmingRemove(null)
  }

  const clearAll = async (): Promise<void> => {
    if (busy !== null || displayQueue.length === 0) return
    const targets = [...displayQueue]
    setBusy('clear')
    setNotice(null)
    let removed = 0
    for (const row of targets) {
      try {
        await updateQueue(row.id, { kind: 'remove' })
        removed += 1
      } catch {
        // Continue through the click-time snapshot. A row can be claimed by
        // the Agent between official per-item removals.
      }
    }
    setPendingOrder(null)
    setEditing(null)
    setConfirmingRemove(null)
    setConfirmingClear(false)
    confirmingClearOrder.current = null
    setSorting(false)
    setCollapsed(removed === targets.length)
    setNotice(removed === targets.length
      ? { level: 'info', text: t('status.cleared', { count: removed }) }
      : { level: 'error', text: t('error.clearPartial', { removed, count: targets.length }) })
    setBusy(null)
  }

  const toggleSorting = (): void => {
    if (sorting) {
      setSorting(false)
      if (manuallyCollapsed.current) setCollapsed(true)
      return
    }
    setCollapsed(false)
    setNotice(null)
    setSorting(true)
  }

  const toggleCollapsed = (): void => {
    setCollapsed(value => {
      const next = !value
      manuallyCollapsed.current = next
      return next
    })
  }

  return (
    <div
      className={styles.dock}
      data-queue-plus-dock=""
      data-queue-plus-mode={sorting ? 'sort' : 'manage'}
    >
      <section
        className={styles.panel}
        data-sorting={sorting || undefined}
        data-drag-active={dragging !== null || undefined}
        aria-label={t('panel.label')}
      >
        {rowCount > 1 && (
          <header className={styles.header}>
            <button
              type="button"
              className={styles.summaryButton}
              aria-expanded={listVisible}
              aria-controls={listId}
              disabled={interactionActive || sorting}
              onClick={toggleCollapsed}
            >
              <span className={styles.lead} aria-hidden="true"><IconQueueOutlineRegular /></span>
              <span className={styles.count}>{t('panel.count', { count: rowCount })}</span>
              {sorting && <span className={styles.sortingLabel}>{t('panel.sorting')}</span>}
            </button>
            {sortable && displayQueue.length > 1 && (
              <button
                type="button"
                className={styles.modeButton}
                data-active={sorting || undefined}
                aria-pressed={sorting}
                disabled={busy !== null || editing !== null || confirmingRemove !== null || confirmingClear}
                onClick={toggleSorting}
              >
                {sorting ? t('action.finishSort') : t('action.sort')}
              </button>
            )}
            {!sorting && (
              <button
                type="button"
                className={styles.collapseButton}
                aria-label={listVisible ? t('action.collapse') : t('action.expand')}
                aria-expanded={listVisible}
                aria-controls={listId}
                disabled={interactionActive}
                onClick={toggleCollapsed}
              >
                <span aria-hidden="true">
                  {listVisible ? <IconChevronDownOutlineRegular /> : <IconChevronUpOutlineRegular />}
                </span>
              </button>
            )}
          </header>
        )}

        {visibleRows.length > 0 && (
          <div
            id={listId}
            className={styles.body}
            data-sorting={sorting || undefined}
            data-drag-active={dragging !== null || undefined}
            aria-busy={busy === 'move'}
            hidden={!listVisible}
          >
            {listVisible && (
              <ol
                className={styles.list}
                aria-label={sorting ? t('panel.sortList') : t('panel.list')}
                aria-describedby={sorting ? sortHintId : undefined}
              >
                {visibleRows.map((row, index) => {
                  const itemId = row.key
                  const rowEditing = !row.pending && editing?.id === row.id
                  const rowConfirmingRemove = !row.pending && confirmingRemove === row.id
                  const otherEditActive = editing !== null && !rowEditing
                  return (
                    <li
                      key={itemId}
                      className={styles.row}
                      data-mode={sorting ? 'sort' : 'manage'}
                      data-dragging={dragging === itemId || undefined}
                      data-dragover={dragOver === itemId || undefined}
                      onDragEnter={() => {
                        if (sorting && dragging !== null && dragging !== itemId) setDragOver(itemId)
                      }}
                      onDragOver={(event) => {
                        if (!sorting || dragging === null) return
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={(event) => {
                        if (!sorting) return
                        event.preventDefault()
                        const source = dragging ?? event.dataTransfer.getData('text/plain')
                        if (source !== '' && source !== itemId) void move(source, index)
                      }}
                    >
                      {row.pending
                        ? (
                            <>
                              {rowCount === 1 && (
                                <span className={styles.lead} aria-hidden="true"><IconQueueOutlineRegular /></span>
                              )}
                              <span className={styles.preview} title={row.preview}>{row.preview}</span>
                              <span className={styles.status} role="status">{t('status.sending')}</span>
                            </>
                          )
                        : sorting
                        ? (
                            <>
                              <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                              <span
                                className={styles.dragHandle}
                                draggable={busy === null}
                                data-disabled={busy !== null || undefined}
                                aria-hidden="true"
                                title={t('action.drag', { position: index + 1 })}
                                onDragStart={(event) => {
                                  setDragging(itemId)
                                  setDragOver(null)
                                  event.dataTransfer.effectAllowed = 'move'
                                  event.dataTransfer.setData('text/plain', itemId)
                                }}
                                onDragEnd={() => {
                                  setDragging(null)
                                  setDragOver(null)
                                }}
                              >
                                <span className={styles.gripDots} />
                              </span>
                              <span className={styles.preview} title={row.preview}>{row.preview}</span>
                              <span className={styles.actions}>
                                <Tooltip label={t('action.moveUp', { position: index + 1 })} side="bottom" delayMs={500}>
                                  <button
                                    type="button"
                                    className={styles.iconButton}
                                    aria-label={t('action.moveUp', { position: index + 1 })}
                                    disabled={busy !== null || index === 0}
                                    onClick={() => { void move(itemId, index - 1) }}
                                  >
                                    <span aria-hidden="true"><IconChevronUpOutlineRegular /></span>
                                  </button>
                                </Tooltip>
                                <Tooltip label={t('action.moveDown', { position: index + 1 })} side="bottom" delayMs={500}>
                                  <button
                                    type="button"
                                    className={styles.iconButton}
                                    aria-label={t('action.moveDown', { position: index + 1 })}
                                    disabled={busy !== null || index === displayQueue.length - 1}
                                    onClick={() => { void move(itemId, index + 1) }}
                                  >
                                    <span aria-hidden="true"><IconChevronDownOutlineRegular /></span>
                                  </button>
                                </Tooltip>
                              </span>
                            </>
                          )
                        : (
                            <>
                              {rowCount === 1 && (
                                <span className={styles.lead} aria-hidden="true"><IconQueueOutlineRegular /></span>
                              )}
                              {rowEditing
                                ? (
                                    <input
                                      autoFocus
                                      className={styles.editor}
                                      aria-label={t('action.edit')}
                                      autoComplete="off"
                                      name="queued-message"
                                      value={editing.text}
                                      onChange={(event) => setEditing({ id: editing.id, text: event.currentTarget.value })}
                                      onKeyDown={(event) => {
                                        if (event.key === 'Escape') {
                                          setEditing(null)
                                          return
                                        }
                                        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                                          event.preventDefault()
                                          void saveEdit()
                                        }
                                      }}
                                    />
                                  )
                                : <span className={styles.preview} title={row.preview}>{row.preview}</span>}

                              {queueMutable && (
                                <span className={styles.actions}>
                                  {rowEditing
                                    ? (
                                        <>
                                          <Tooltip label={t('action.save')} side="bottom" delayMs={500}>
                                            <button
                                              type="button"
                                              className={styles.iconButton}
                                              aria-label={t('action.save')}
                                              disabled={busy !== null || editing.text.trim() === ''}
                                              onClick={() => { void saveEdit() }}
                                            >
                                              <span aria-hidden="true"><IconCheckOutlineRegular size={14} /></span>
                                            </button>
                                          </Tooltip>
                                          <Tooltip label={t('action.cancelEdit')} side="bottom" delayMs={500}>
                                            <button
                                              type="button"
                                              className={styles.iconButton}
                                              aria-label={t('action.cancelEdit')}
                                              disabled={busy !== null}
                                              onClick={() => setEditing(null)}
                                            >
                                              <span aria-hidden="true"><IconCloseOutlineRegular size={14} /></span>
                                            </button>
                                          </Tooltip>
                                        </>
                                      )
                                    : rowConfirmingRemove
                                      ? (
                                          <>
                                            <button
                                              type="button"
                                              className={styles.inlineButton}
                                              disabled={busy !== null}
                                              onClick={() => setConfirmingRemove(null)}
                                            >
                                              {t('action.cancelRemove')}
                                            </button>
                                            <button
                                              type="button"
                                              className={styles.dangerButton}
                                              disabled={busy !== null}
                                              onClick={() => { void removeMessage(row.id) }}
                                            >
                                              {t('action.confirmRemove')}
                                            </button>
                                          </>
                                        )
                                    : (
                                        <>
                                          <Tooltip
                                            label={t('action.edit')}
                                            side="bottom"
                                            delayMs={500}
                                            disabled={row.text === null}
                                          >
                                            <button
                                              type="button"
                                              className={styles.iconButton}
                                              aria-label={t('action.edit')}
                                              title={row.text === null ? t('action.editUnsupported') : undefined}
                                              disabled={busy !== null || otherEditActive
                                                || confirmingRemove !== null || confirmingClear || row.text === null}
                                              onClick={() => {
                                                if (row.text !== null) setEditing({ id: row.id, text: row.text })
                                              }}
                                            >
                                              <span aria-hidden="true"><IconEditOutlineRegular size={14} /></span>
                                            </button>
                                          </Tooltip>
                                          <Tooltip label={t('action.remove')} side="bottom" delayMs={500}>
                                            <button
                                              type="button"
                                              className={styles.iconButton}
                                              aria-label={t('action.remove')}
                                              disabled={busy !== null || editing !== null
                                                || confirmingRemove !== null || confirmingClear}
                                              onClick={() => {
                                                setNotice(null)
                                                setConfirmingRemove(row.id)
                                              }}
                                            >
                                              <span aria-hidden="true"><IconTrashOutlineRegular size={14} /></span>
                                            </button>
                                          </Tooltip>
                                          <Tooltip
                                            label={t('action.steer')}
                                            side="bottom"
                                            delayMs={500}
                                            disabled={!running}
                                          >
                                            <button
                                              type="button"
                                              className={styles.iconButton}
                                              aria-label={t('action.steer')}
                                              title={running ? undefined : t('action.steerUnavailable')}
                                              disabled={busy !== null || editing !== null
                                                || confirmingRemove !== null || confirmingClear || !running}
                                              onClick={() => {
                                                void applyQueueAction(row.id, { kind: 'steer' }, t('error.steer'))
                                              }}
                                            >
                                              <span aria-hidden="true"><IconSendOutlineRegular /></span>
                                            </button>
                                          </Tooltip>
                                        </>
                                      )}
                                </span>
                              )}
                            </>
                          )}
                    </li>
                  )
                })}
              </ol>
            )}

            {listVisible && queueMutable && displayQueue.length > 1 && (
              <footer className={styles.footer} data-sorting={sorting || undefined}>
                <span id={sorting ? sortHintId : undefined} className={styles.footnote}>
                  {sorting
                    ? dragging === null ? t('hint.sort') : t('hint.drop')
                    : confirmingClear
                      ? t('status.confirmClear', { count: displayQueue.length })
                      : t('hint.clear')}
                </span>
                {!sorting && (
                  confirmingClear
                    ? (
                        <span className={styles.actions}>
                          <button
                            type="button"
                            className={styles.inlineButton}
                            disabled={busy !== null}
                            onClick={() => {
                              setConfirmingClear(false)
                              confirmingClearOrder.current = null
                            }}
                          >
                            {t('action.cancelRemove')}
                          </button>
                          <button
                            type="button"
                            className={styles.dangerButton}
                            disabled={busy !== null}
                            onClick={() => { void clearAll() }}
                          >
                            {t('action.confirmClear')}
                          </button>
                        </span>
                      )
                    : (
                        <button
                          type="button"
                          className={styles.clearButton}
                          disabled={busy !== null || editing !== null || confirmingRemove !== null}
                          onClick={() => {
                            setNotice(null)
                            confirmingClearOrder.current = expectedOrder()
                            setConfirmingClear(true)
                          }}
                        >
                          {t('action.clear')}
                        </button>
                      )
                )}
              </footer>
            )}
          </div>
        )}

        {notice !== null && (
          <div
            className={styles.notice}
            data-level={notice.level}
            role={notice.level === 'error' ? 'alert' : 'status'}
            aria-live={notice.level === 'error' ? 'assertive' : 'polite'}
          >
            {notice.text}
          </div>
        )}

        {announcement !== null && (
          <span key={announcement.key} className={styles.srOnly} role="status" aria-live="polite">
            {announcement.text}
          </span>
        )}
      </section>
    </div>
  )
}
