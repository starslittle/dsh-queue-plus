/** Queue Plus browser half: a unified replacement for the stock queue dock. */
import type { ClientContext, ISessions, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { createElement } from 'react'
import { QueuePlusDock, type QueuePlusDockInjected } from './QueuePlusDock'
import { en, NS, zh } from './locales'
import { installStyles } from './styles'

export { QueuePlusDock } from './QueuePlusDock'

export const inject = ['slots', 'locale', 'conversation', 'sessions']

type DockProps = PropsRuntime<'conversation.input.dock'> & PropsLocale<typeof NS> & QueuePlusDockInjected

export function apply(ctx: ClientContext): void {
  // Host and browser declarations share this package's typecheck program;
  // narrow the browser service explicitly at the bundle boundary.
  const sessions = ctx.sessions as unknown as ISessions
  ctx.effect(() => installStyles(document), 'queue-plus: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'queue-plus: dictionaries')
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    // Share the stock dock's cell at a lower priority. Slot shadowing keeps
    // the official QueueDock as the automatic fallback when this entry leaves.
    id: 'queue',
    order: 20,
    priority: -10,
    locale: NS,
    inject: (sessionId: SessionId): QueuePlusDockInjected => {
      const actx = sessions.scope(sessionId)
      if (actx === undefined) throw new Error(`queue plus: session "${sessionId}" resolved no scope`)
      const conversation = actx.get('conversation')
      if (conversation === undefined) throw new Error('queue plus: conversation service unavailable')
      return {
        updateQueue: (itemId, action) => conversation.updateQueue(itemId, action),
      }
    },
  }, (props: DockProps) => createElement(QueuePlusDock, props)))
}
