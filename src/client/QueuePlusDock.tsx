import type { QueuedMessage } from '@deepseek-ai/dsh-client-runtime/client'
import {
  IconChevronDownOutline14,
  IconChevronUpOutline14,
  IconQueueOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { useEffect, useId, useMemo, useState } from 'react'
import { clearQueue, moveQueue, QueuePlusClientError, undoClear } from './api'
import { NS } from './locales'
import { styles } from './styles'

type QueuePlusDockProps = PropsRuntime<'conversation.input.dock'> & PropsLocale<typeof NS>

interface UndoState {
  readonly token: string
  readonly count: number
  readonly expiresAt: number
}

interface Notice {
  readonly level: 'info' | 'error'
  readonly text: string
}

function queued(rows: readonly QueuedMessage[]): QueuedMessage[] {
  return rows.filter(row => row.placement === 'queued')
}

function errorText(error: unknown, t: QueuePlusDockProps['t']): string {
  if (error instanceof QueuePlusClientError) {
    if (error.code === 'QUEUE_CHANGED' || error.code === 'ITEM_NOT_FOUND') return t('error.queueChanged')
    if (error.code === 'UNDO_EXPIRED' || error.code === 'UNDO_NOT_FOUND') return t('error.expired')
  }
  return t('error.generic')
}

/** Complementary dock: official QueueDock keeps edit/remove/steer ownership. */
export function QueuePlusDock({ useSession, sessionId, t }: QueuePlusDockProps): React.JSX.Element | null {
  const inbox = useSession(snapshot => snapshot.queue)
  const queue = useMemo(() => queued(inbox), [inbox])
  const queueMutable = useSession(snapshot => snapshot.subagent === null)
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState<'move' | 'clear' | 'undo' | null>(null)
  const [undo, setUndo] = useState<UndoState | null>(null)
  const [clock, setClock] = useState(Date.now())
  const [notice, setNotice] = useState<Notice | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const listId = useId()

  useEffect(() => {
    if (queue.length < 2) setExpanded(false)
    if (dragging !== null && !queue.some(row => String(row.id) === dragging)) setDragging(null)
    if (dragOver !== null && !queue.some(row => String(row.id) === dragOver)) setDragOver(null)
  }, [dragOver, dragging, queue])

  useEffect(() => {
    if (undo === null) return undefined
    setClock(Date.now())
    const timer = window.setInterval(() => {
      const now = Date.now()
      setClock(now)
      if (now >= undo.expiresAt) {
        window.clearInterval(timer)
        setUndo(current => current?.token === undo.token ? null : current)
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [undo])

  useEffect(() => {
    if (notice === null) return undefined
    const timer = window.setTimeout(() => setNotice(current => current === notice ? null : current), 3_500)
    return () => window.clearTimeout(timer)
  }, [notice])

  if (!queueMutable || (queue.length < 2 && undo === null)) return null

  const expectedOrder = (): string[] => queue.map(row => String(row.id))
  const seconds = undo === null ? 0 : Math.max(0, Math.ceil((undo.expiresAt - clock) / 1_000))

  const move = async (itemId: string, toIndex: number): Promise<void> => {
    if (busy !== null || toIndex < 0 || toIndex >= queue.length) return
    setBusy('move')
    setNotice(null)
    try {
      await moveQueue({ action: 'move', sessionId: String(sessionId), itemId, toIndex, expectedOrder: expectedOrder() })
      setNotice({ level: 'info', text: t('status.moved') })
    } catch (error: unknown) {
      setNotice({ level: 'error', text: errorText(error, t) })
    } finally {
      setBusy(null)
      setDragging(null)
      setDragOver(null)
    }
  }

  const clearAll = async (): Promise<void> => {
    if (busy !== null || queue.length === 0) return
    setBusy('clear')
    setNotice(null)
    try {
      const result = await clearQueue(String(sessionId), expectedOrder())
      setUndo({ token: result.token, count: result.count, expiresAt: result.expiresAt })
      setExpanded(false)
    } catch (error: unknown) {
      setNotice({ level: 'error', text: errorText(error, t) })
    } finally {
      setBusy(null)
    }
  }

  const restore = async (): Promise<void> => {
    if (busy !== null || undo === null) return
    const current = undo
    setBusy('undo')
    setNotice(null)
    try {
      const result = await undoClear(String(sessionId), current.token)
      setUndo(null)
      setNotice({ level: 'info', text: t('status.restored', { count: result.restored }) })
    } catch (error: unknown) {
      if (error instanceof QueuePlusClientError
        && (error.code === 'UNDO_EXPIRED' || error.code === 'UNDO_NOT_FOUND')) setUndo(null)
      setNotice({ level: 'error', text: errorText(error, t) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={styles.dock} data-queue-plus-dock="">
      <section className={styles.panel} aria-label={t('panel.label')}>
        {queue.length >= 2 && (
          <>
            <button
              type="button"
              className={styles.header}
              aria-expanded={expanded}
              aria-controls={listId}
              aria-label={expanded ? t('action.collapse') : t('action.expand')}
              disabled={busy !== null}
              onClick={() => setExpanded(value => !value)}
            >
              <span className={styles.heading}>
                <span className={styles.lead} aria-hidden="true"><IconQueueOutline14 /></span>
                <span className={styles.title}>{t('panel.title')}</span>
                <span className={styles.count}>{t('panel.count', { count: queue.length })}</span>
              </span>
              <span className={styles.hint}>{t('panel.hint')}</span>
              <span className={styles.chevron} aria-hidden="true">
                {expanded ? <IconChevronDownOutline14 /> : <IconChevronUpOutline14 />}
              </span>
            </button>
            {expanded && (
              <div className={styles.body}>
                <ol id={listId} className={styles.list}>
                  {queue.map((row, index) => {
                    const itemId = String(row.id)
                    return (
                      <li
                        key={itemId}
                        className={styles.row}
                        draggable={busy === null}
                        data-dragging={dragging === itemId || undefined}
                        data-dragover={dragOver === itemId || undefined}
                        onDragStart={(event) => {
                          setDragging(itemId)
                          event.dataTransfer.effectAllowed = 'move'
                          event.dataTransfer.setData('text/plain', itemId)
                        }}
                        onDragEnter={() => setDragOver(itemId)}
                        onDragOver={(event) => {
                          event.preventDefault()
                          event.dataTransfer.dropEffect = 'move'
                        }}
                        onDrop={(event) => {
                          event.preventDefault()
                          const source = dragging ?? event.dataTransfer.getData('text/plain')
                          if (source !== '' && source !== itemId) void move(source, index)
                        }}
                        onDragEnd={() => {
                          setDragging(null)
                          setDragOver(null)
                        }}
                      >
                        <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                        <span className={styles.grip} aria-hidden="true">⠿</span>
                        <span className={styles.preview} title={row.preview}>{row.preview}</span>
                        <span className={styles.actions}>
                          <button
                            type="button"
                            className={styles.iconButton}
                            aria-label={t('action.moveUp', { preview: row.preview })}
                            title={t('action.moveUp', { preview: row.preview })}
                            disabled={busy !== null || index === 0}
                            onClick={() => { void move(itemId, index - 1) }}
                          >
                            <IconChevronUpOutline14 />
                          </button>
                          <button
                            type="button"
                            className={styles.iconButton}
                            aria-label={t('action.moveDown', { preview: row.preview })}
                            title={t('action.moveDown', { preview: row.preview })}
                            disabled={busy !== null || index === queue.length - 1}
                            onClick={() => { void move(itemId, index + 1) }}
                          >
                            <IconChevronDownOutline14 />
                          </button>
                        </span>
                      </li>
                    )
                  })}
                </ol>
                <footer className={styles.footer}>
                  <span className={styles.footnote}>{t('hint.undo')}</span>
                  <button
                    type="button"
                    className={styles.clearButton}
                    disabled={busy !== null}
                    onClick={() => { void clearAll() }}
                  >
                    {t('action.clear')}
                  </button>
                </footer>
              </div>
            )}
          </>
        )}
        {undo !== null && (
          <div className={styles.undo} role="status">
            <span className={styles.undoText}>{t('status.cleared', { count: undo.count })}</span>
            <button
              type="button"
              className={styles.undoButton}
              disabled={busy !== null || seconds === 0}
              onClick={() => { void restore() }}
            >
              {t('action.undo', { seconds })}
            </button>
          </div>
        )}
        {notice !== null && (
          <div
            className={styles.notice}
            data-level={notice.level}
            role={notice.level === 'error' ? 'alert' : 'status'}
          >
            {notice.text}
          </div>
        )}
      </section>
    </div>
  )
}
