import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  IconChevronDownOutline14: () => null,
  IconChevronUpOutline14: () => null,
  IconQueueOutline14: () => null,
}))

import { apply } from '../src/client/index'
import { STYLE_ID } from '../src/client/styles'

function harness(): { ctx: ClientContext; registrations: string[]; dispose(): void } {
  const disposers: Array<() => void> = []
  const registrations: string[] = []
  const ctx = {
    effect(setup: () => void | (() => void)) {
      const dispose = setup()
      if (typeof dispose === 'function') disposers.push(dispose)
    },
    locale: {
      register() { return () => undefined },
    },
    slots: {
      inject(_name: string, setup: () => () => void) {
        const dispose = setup()
        disposers.push(dispose)
        return dispose
      },
      register(options: { name: string; id: string }) {
        registrations.push(`${options.name}:${options.id}`)
        return () => undefined
      },
    },
  } as unknown as ClientContext
  return {
    ctx,
    registrations,
    dispose() { for (const dispose of disposers.reverse()) dispose() },
  }
}

describe('client plugin lifecycle', () => {
  it('registers one dock and removes its style on unload', () => {
    const first = harness()
    apply(first.ctx)
    expect(first.registrations).toEqual(['conversation.input.dock:queue-plus'])
    expect(document.getElementById(STYLE_ID)).not.toBeNull()
    first.dispose()
    expect(document.getElementById(STYLE_ID)).toBeNull()
  })
})
