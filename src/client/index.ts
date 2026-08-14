/** Queue Plus browser half: a complementary queue-management dock. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { createElement } from 'react'
import { QueuePlusDock } from './QueuePlusDock'
import { en, NS, zh } from './locales'
import { installStyles } from './styles'

export { QueuePlusDock } from './QueuePlusDock'

export const inject = ['slots', 'locale']

type DockProps = PropsRuntime<'conversation.input.dock'> & PropsLocale<typeof NS>

export function apply(ctx: ClientContext): void {
  ctx.effect(() => installStyles(document), 'queue-plus: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'queue-plus: dictionaries')
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'queue-plus',
    order: 25,
    locale: NS,
  }, (props: DockProps) => createElement(QueuePlusDock, props)))
}
