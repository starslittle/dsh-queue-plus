export const styles = {
  dock: 'dsh-queue-plus-dock',
  panel: 'dsh-queue-plus-panel',
  header: 'dsh-queue-plus-header',
  heading: 'dsh-queue-plus-heading',
  lead: 'dsh-queue-plus-lead',
  title: 'dsh-queue-plus-title',
  count: 'dsh-queue-plus-count',
  hint: 'dsh-queue-plus-hint',
  chevron: 'dsh-queue-plus-chevron',
  body: 'dsh-queue-plus-body',
  list: 'dsh-queue-plus-list',
  row: 'dsh-queue-plus-row',
  index: 'dsh-queue-plus-index',
  grip: 'dsh-queue-plus-grip',
  preview: 'dsh-queue-plus-preview',
  actions: 'dsh-queue-plus-actions',
  iconButton: 'dsh-queue-plus-icon-button',
  footer: 'dsh-queue-plus-footer',
  footnote: 'dsh-queue-plus-footnote',
  clearButton: 'dsh-queue-plus-clear-button',
  undo: 'dsh-queue-plus-undo',
  undoText: 'dsh-queue-plus-undo-text',
  undoButton: 'dsh-queue-plus-undo-button',
  notice: 'dsh-queue-plus-notice',
} as const

export const STYLE_ID = 'dsh-queue-plus-style'
const STYLE_REFS = Symbol.for('dsh.queuePlus.styleRefs')

interface StyleDocument extends Document {
  [STYLE_REFS]?: number
}

export const STYLE_TEXT = String.raw`
.dsh-queue-plus-dock{box-sizing:border-box;flex:none;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));max-width:calc(var(--dsh-composer-card-max-width) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));margin:0 auto calc(0px - var(--dsh-composer-stack-gap) - 3px);padding:0 var(--dsh-composer-dock-inset)}
.dsh-queue-plus-panel{position:relative;width:100%;overflow:hidden;padding:2px 0;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-tip);border-radius:12px 12px 0 0}
.dsh-queue-plus-panel::after{position:absolute;inset:0;pointer-events:none;content:"";border:1px solid var(--dsw-alias-border-l1);border-bottom:0;border-radius:inherit}
[data-queue-dock]+.dsh-queue-plus-dock .dsh-queue-plus-panel{border-radius:0}
.dsh-queue-plus-header{box-sizing:border-box;display:flex;align-items:center;width:100%;height:36px;gap:10px;padding:4px 12px;color:inherit;font:inherit;text-align:start;cursor:pointer;background:transparent;border:0;border-radius:8px}
.dsh-queue-plus-heading{display:flex;align-items:center;min-width:0;gap:9px}
.dsh-queue-plus-lead{position:relative;display:grid;flex:none;color:var(--dsw-alias-state-business-primary);place-items:center}
.dsh-queue-plus-lead::after{position:absolute;inset-block-start:-5px;inset-inline-end:-5px;content:"+";font-size:9px;font-weight:700;line-height:10px}
.dsh-queue-plus-title{overflow:hidden;font-family:Inter,var(--dsw-font-family);font-size:13px;font-weight:500;line-height:24px;text-overflow:ellipsis;white-space:nowrap}
.dsh-queue-plus-count{flex:none;color:var(--dsw-alias-label-secondary);font-size:12px;font-variant-numeric:tabular-nums}
.dsh-queue-plus-hint{flex:1;min-width:0;overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:12px;text-align:end;text-overflow:ellipsis;white-space:nowrap}
.dsh-queue-plus-chevron{display:grid;flex:none;width:14px;height:14px;color:var(--dsw-alias-label-tertiary);place-items:center}
.dsh-queue-plus-body{border-top:1px solid var(--dsw-alias-border-l1)}
.dsh-queue-plus-list{max-height:min(32dvh,240px);margin:0;padding:4px;overflow-y:auto;overscroll-behavior:contain;list-style:none}
.dsh-queue-plus-row{display:grid;grid-template-columns:24px 18px minmax(0,1fr) 66px;align-items:center;min-height:38px;gap:6px;padding:2px 4px;border-radius:8px}
.dsh-queue-plus-row+.dsh-queue-plus-row{box-shadow:inset 0 1px 0 var(--dsw-alias-border-l1)}
.dsh-queue-plus-row[draggable=true]{cursor:grab}
.dsh-queue-plus-row[draggable=true]:active{cursor:grabbing}
.dsh-queue-plus-row[data-dragging=true]{opacity:.48}
.dsh-queue-plus-row[data-dragover=true]{background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 3px 0 0 var(--dsw-alias-state-business-primary)}
.dsh-queue-plus-index{color:var(--dsw-alias-label-tertiary);font:600 11px/20px ui-monospace,SFMono-Regular,Consolas,monospace;text-align:end;font-variant-numeric:tabular-nums}
.dsh-queue-plus-grip{overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:16px;line-height:20px;text-align:center;user-select:none}
.dsh-queue-plus-preview{min-width:0;overflow:hidden;color:var(--dsw-alias-label-primary-dimmed);font:var(--dsw-font-xs-13);font-family:Inter,var(--dsw-font-family);text-overflow:ellipsis;white-space:nowrap;word-break:break-word}
.dsh-queue-plus-actions{display:flex;align-items:center;justify-content:flex-end;gap:5px}
.dsh-queue-plus-icon-button{display:grid;place-items:center;width:28px;height:28px;padding:0;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:transparent;border:0;border-radius:999px}
.dsh-queue-plus-icon-button:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.dsh-queue-plus-icon-button:disabled{cursor:default;opacity:.28}
.dsh-queue-plus-footer{display:flex;align-items:center;justify-content:space-between;min-height:36px;gap:12px;padding:4px 8px 4px 12px;border-top:1px solid var(--dsw-alias-border-l1)}
.dsh-queue-plus-footnote{min-width:0;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px}
.dsh-queue-plus-clear-button{flex:none;padding:4px 9px;color:var(--dsw-alias-state-error-primary);font:500 12px/20px Inter,var(--dsw-font-family);cursor:pointer;background:transparent;border:0;border-radius:7px}
.dsh-queue-plus-clear-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsh-queue-plus-clear-button:disabled{cursor:default;opacity:.4}
.dsh-queue-plus-undo{display:flex;align-items:center;min-height:36px;gap:10px;padding:4px 8px 4px 12px}
.dsh-queue-plus-undo-text{flex:1;min-width:0;overflow:hidden;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:20px;text-overflow:ellipsis;white-space:nowrap}
.dsh-queue-plus-undo-button{flex:none;padding:3px 10px;color:var(--dsw-alias-state-business-primary);font:600 12px/20px Inter,var(--dsw-font-family);cursor:pointer;background:transparent;border:1px solid var(--dsw-alias-state-business-primary);border-radius:7px;font-variant-numeric:tabular-nums}
.dsh-queue-plus-undo-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsh-queue-plus-undo-button:disabled{cursor:default;opacity:.45}
.dsh-queue-plus-notice{padding:3px 12px 5px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;border-top:1px solid var(--dsw-alias-border-l1)}
.dsh-queue-plus-notice[data-level=error]{color:var(--dsw-alias-state-error-primary)}
.dsh-queue-plus-header:focus-visible,.dsh-queue-plus-icon-button:focus-visible,.dsh-queue-plus-clear-button:focus-visible,.dsh-queue-plus-undo-button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
@media(max-width:520px){.dsh-queue-plus-dock{width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance));padding-inline:0}.dsh-queue-plus-hint{display:none}.dsh-queue-plus-row{grid-template-columns:22px 16px minmax(0,1fr) 66px}}
@media(prefers-reduced-motion:reduce){.dsh-queue-plus-row{transition:none}}
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
