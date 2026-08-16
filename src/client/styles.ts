export const styles = {
  dock: 'dsh-queue-plus-dock',
  panel: 'dsh-queue-plus-panel',
  header: 'dsh-queue-plus-header',
  summaryButton: 'dsh-queue-plus-summary-button',
  lead: 'dsh-queue-plus-lead',
  count: 'dsh-queue-plus-count',
  sortingLabel: 'dsh-queue-plus-sorting-label',
  modeButton: 'dsh-queue-plus-mode-button',
  collapseButton: 'dsh-queue-plus-collapse-button',
  body: 'dsh-queue-plus-body',
  list: 'dsh-queue-plus-list',
  row: 'dsh-queue-plus-row',
  index: 'dsh-queue-plus-index',
  dragHandle: 'dsh-queue-plus-drag-handle',
  gripDots: 'dsh-queue-plus-grip-dots',
  preview: 'dsh-queue-plus-preview',
  editor: 'dsh-queue-plus-editor',
  actions: 'dsh-queue-plus-actions',
  iconButton: 'dsh-queue-plus-icon-button',
  inlineButton: 'dsh-queue-plus-inline-button',
  dangerButton: 'dsh-queue-plus-danger-button',
  footer: 'dsh-queue-plus-footer',
  footnote: 'dsh-queue-plus-footnote',
  clearButton: 'dsh-queue-plus-clear-button',
  notice: 'dsh-queue-plus-notice',
  srOnly: 'dsh-queue-plus-sr-only',
} as const

export const STYLE_ID = 'dsh-queue-plus-style'
const STYLE_REFS = Symbol.for('dsh.queuePlus.styleRefs')

interface StyleDocument extends Document {
  [STYLE_REFS]?: number
}

export const STYLE_TEXT = String.raw`
.dsh-queue-plus-dock {
  box-sizing: border-box;
  flex: none;
  width: calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));
  max-width: calc(var(--dsh-composer-card-max-width) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));
  margin: 0 auto calc(0px - var(--dsh-composer-stack-gap) - 3px);
  padding: 0 var(--dsh-composer-dock-inset);
}

.dsh-queue-plus-panel {
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: 2px 0;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-specific-tip);
  border-radius: 12px 12px 0 0;
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
}

.dsh-queue-plus-panel::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  border: 1px solid var(--dsw-alias-border-l1);
  border-bottom: 0;
  border-radius: inherit;
}

.dsh-queue-plus-header {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  min-height: 40px;
  gap: 4px;
  padding: 2px 6px 2px 4px;
}

.dsh-queue-plus-summary-button {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  align-self: stretch;
  min-width: 0;
  gap: 9px;
  padding: 4px 8px;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  touch-action: manipulation;
}

.dsh-queue-plus-summary-button:disabled {
  cursor: default;
}

.dsh-queue-plus-lead {
  display: grid;
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  place-items: center;
}

.dsh-queue-plus-panel[data-sorting='true'] .dsh-queue-plus-lead {
  color: var(--dsw-alias-state-business-primary);
}

.dsh-queue-plus-count {
  min-width: 0;
  overflow: hidden;
  font-family: Inter, var(--dsw-font-family);
  font-size: 13px;
  font-weight: 500;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-queue-plus-sorting-label {
  display: inline-flex;
  flex: none;
  align-items: center;
  min-height: 20px;
  padding: 0 7px;
  color: var(--dsw-alias-state-business-primary);
  font-family: Inter, var(--dsw-font-family);
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
  background: var(--dsw-alias-interactive-bg-hover);
  border-radius: 999px;
}

.dsh-queue-plus-sorting-label::before {
  width: 5px;
  height: 5px;
  margin-inline-end: 6px;
  background: currentColor;
  border-radius: 50%;
  content: '';
}

.dsh-queue-plus-mode-button,
.dsh-queue-plus-collapse-button,
.dsh-queue-plus-icon-button,
.dsh-queue-plus-inline-button,
.dsh-queue-plus-danger-button,
.dsh-queue-plus-clear-button {
  font-family: Inter, var(--dsw-font-family);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.dsh-queue-plus-mode-button {
  flex: none;
  min-width: 48px;
  height: 30px;
  padding: 0 10px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 500;
  line-height: 28px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.dsh-queue-plus-mode-button[data-active='true'] {
  color: var(--dsw-alias-state-business-primary);
  background: var(--dsw-alias-interactive-bg-hover);
}

.dsh-queue-plus-collapse-button,
.dsh-queue-plus-icon-button {
  display: grid;
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
  place-items: center;
}

.dsh-queue-plus-mode-button:disabled,
.dsh-queue-plus-collapse-button:disabled,
.dsh-queue-plus-icon-button:disabled,
.dsh-queue-plus-inline-button:disabled,
.dsh-queue-plus-danger-button:disabled,
.dsh-queue-plus-clear-button:disabled {
  cursor: default;
  opacity: .42;
}

.dsh-queue-plus-body {
  border-top: 1px solid var(--dsw-alias-border-l1);
}

.dsh-queue-plus-list {
  max-height: min(36dvh, 260px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  list-style: none;
}

.dsh-queue-plus-body[data-sorting='true'] .dsh-queue-plus-list {
  display: grid;
  gap: 0;
}

.dsh-queue-plus-body[data-drag-active='true'] {
  cursor: grabbing;
  user-select: none;
}

.dsh-queue-plus-row {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  gap: 10px;
  padding: 4px 6px 4px 12px;
  border-radius: 8px;
  content-visibility: auto;
  contain-intrinsic-size: auto 40px;
  transition: opacity 160ms ease-out, transform 160ms ease-out;
}

.dsh-queue-plus-row[data-mode='sort'] {
  display: grid;
  grid-template-columns: 24px 28px minmax(0, 1fr) 66px;
  gap: 6px;
  min-height: 42px;
  padding: 4px 6px;
  background: transparent;
}

.dsh-queue-plus-row + .dsh-queue-plus-row {
  box-shadow: inset 0 1px 0 var(--dsw-alias-border-l1);
}

.dsh-queue-plus-row[data-dragging='true'] {
  z-index: 1;
  opacity: .58;
  transform: scale(.985);
}

.dsh-queue-plus-row[data-dragover='true'] {
  background: var(--dsw-alias-interactive-bg-hover);
  outline: 1px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}

.dsh-queue-plus-index {
  display: grid;
  width: 24px;
  height: 24px;
  color: var(--dsw-alias-label-tertiary);
  font: 600 11px/20px ui-monospace, SFMono-Regular, Consolas, monospace;
  place-items: center;
  font-variant-numeric: tabular-nums;
}

.dsh-queue-plus-drag-handle {
  display: grid;
  width: 28px;
  height: 30px;
  color: var(--dsw-alias-label-tertiary);
  cursor: grab;
  place-items: center;
  user-select: none;
  touch-action: manipulation;
}

.dsh-queue-plus-drag-handle:active {
  cursor: grabbing;
}

.dsh-queue-plus-drag-handle[data-disabled='true'] {
  cursor: default;
  opacity: .42;
}

.dsh-queue-plus-body[data-drag-active='true'] .dsh-queue-plus-drag-handle {
  cursor: grabbing;
}

.dsh-queue-plus-grip-dots {
  position: relative;
  width: 3px;
  height: 3px;
  transform: translate(-3px, -6px);
  color: currentColor;
  background: currentColor;
  border-radius: 50%;
  box-shadow: 0 6px currentColor, 0 12px currentColor, 6px 0 currentColor, 6px 6px currentColor, 6px 12px currentColor;
}

.dsh-queue-plus-preview,
.dsh-queue-plus-editor {
  flex: 1 1 auto;
  min-width: 0;
  font: var(--dsw-font-xs-13);
  font-family: Inter, var(--dsw-font-family);
}

.dsh-queue-plus-preview {
  overflow: hidden;
  color: var(--dsw-alias-label-primary-dimmed);
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-word;
}

.dsh-queue-plus-editor {
  box-sizing: border-box;
  height: 30px;
  padding: 0 8px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 7px;
  outline: none;
}

.dsh-queue-plus-editor:focus-visible {
  border-color: var(--dsw-alias-state-business-primary);
  box-shadow: 0 0 0 1px var(--dsw-alias-state-business-primary);
}

.dsh-queue-plus-actions {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
}

.dsh-queue-plus-row[data-mode='sort'] .dsh-queue-plus-actions {
  gap: 3px;
}

.dsh-queue-plus-inline-button,
.dsh-queue-plus-danger-button {
  flex: none;
  min-height: 30px;
  padding: 3px 9px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.dsh-queue-plus-danger-button {
  color: var(--dsw-alias-state-error-primary);
}

.dsh-queue-plus-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  gap: 12px;
  padding: 4px 8px 4px 12px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}

.dsh-queue-plus-footer[data-sorting='true'] {
  justify-content: flex-start;
}

.dsh-queue-plus-footnote {
  min-width: 0;
  overflow: hidden;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-queue-plus-clear-button {
  flex: none;
  min-height: 30px;
  padding: 4px 9px;
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.dsh-queue-plus-notice {
  padding: 5px 12px 7px;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 16px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}

.dsh-queue-plus-notice[data-level='error'] {
  color: var(--dsw-alias-state-error-primary);
}

.dsh-queue-plus-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
}

.dsh-queue-plus-summary-button:focus-visible,
.dsh-queue-plus-mode-button:focus-visible,
.dsh-queue-plus-collapse-button:focus-visible,
.dsh-queue-plus-icon-button:focus-visible,
.dsh-queue-plus-inline-button:focus-visible,
.dsh-queue-plus-danger-button:focus-visible,
.dsh-queue-plus-clear-button:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}

.dsh-queue-plus-summary-button:active:not(:disabled),
.dsh-queue-plus-mode-button:active:not(:disabled),
.dsh-queue-plus-collapse-button:active:not(:disabled),
.dsh-queue-plus-icon-button:active:not(:disabled),
.dsh-queue-plus-inline-button:active:not(:disabled),
.dsh-queue-plus-danger-button:active:not(:disabled),
.dsh-queue-plus-clear-button:active:not(:disabled) {
  opacity: .72;
}

@media (hover: hover) {
  .dsh-queue-plus-summary-button:hover:not(:disabled),
  .dsh-queue-plus-mode-button:hover:not(:disabled),
  .dsh-queue-plus-collapse-button:hover:not(:disabled),
  .dsh-queue-plus-icon-button:hover:not(:disabled),
  .dsh-queue-plus-inline-button:hover:not(:disabled),
  .dsh-queue-plus-danger-button:hover:not(:disabled),
  .dsh-queue-plus-clear-button:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
  }

  .dsh-queue-plus-drag-handle:hover {
    color: var(--dsw-alias-label-secondary);
  }
}

@media (pointer: coarse) {
  .dsh-queue-plus-header,
  .dsh-queue-plus-row {
    min-height: 48px;
  }

  .dsh-queue-plus-header {
    gap: 8px;
  }

  .dsh-queue-plus-mode-button,
  .dsh-queue-plus-collapse-button,
  .dsh-queue-plus-icon-button,
  .dsh-queue-plus-inline-button,
  .dsh-queue-plus-danger-button,
  .dsh-queue-plus-drag-handle,
  .dsh-queue-plus-clear-button {
    min-width: 44px;
    min-height: 44px;
  }

  .dsh-queue-plus-row[data-mode='sort'] {
    grid-template-columns: 24px 44px minmax(0, 1fr) 96px;
  }

  .dsh-queue-plus-actions {
    gap: 8px;
  }

  .dsh-queue-plus-row[data-mode='sort'] .dsh-queue-plus-actions {
    gap: 8px;
  }
}

@media (max-width: 520px) {
  .dsh-queue-plus-dock {
    width: calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance));
    padding-inline: 0;
  }

  .dsh-queue-plus-header {
    padding-inline-start: 2px;
  }

  .dsh-queue-plus-sorting-label {
    display: none;
  }

  .dsh-queue-plus-row {
    gap: 6px;
    padding-inline: 8px 4px;
  }

  .dsh-queue-plus-row[data-mode='sort'] {
    padding-inline: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dsh-queue-plus-row {
    transition: none;
  }
}

`

export function installStyles(document: Document): () => void {
  const styleDocument = document as StyleDocument
  let element = document.getElementById(STYLE_ID)
  if (element === null) {
    element = document.createElement('style')
    element.id = STYLE_ID
    element.textContent = STYLE_TEXT
    document.head.appendChild(element)
  }
  styleDocument[STYLE_REFS] = (styleDocument[STYLE_REFS] ?? 0) + 1
  let active = true
  return () => {
    if (!active) return
    active = false
    const next = Math.max(0, (styleDocument[STYLE_REFS] ?? 1) - 1)
    styleDocument[STYLE_REFS] = next
    if (next === 0) document.getElementById(STYLE_ID)?.remove()
  }
}
