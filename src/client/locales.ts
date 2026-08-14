import type { LocaleDictOf } from '@deepseek-ai/dsh-client-ui-slots'

export const NS = 'queue-plus' as const

export const zh = {
  'panel.label': '队列顺序工具',
  'panel.title': '调整执行顺序',
  'panel.count': '{count} 条',
  'panel.hint': '拖动，或使用上下箭头',
  'action.expand': '展开队列顺序工具',
  'action.collapse': '收起队列顺序工具',
  'action.moveUp': '上移：{preview}',
  'action.moveDown': '下移：{preview}',
  'action.clear': '清空全部',
  'action.undo': '撤销（{seconds}s）',
  'status.cleared': '已清空 {count} 条排队消息',
  'status.restored': '已恢复 {count} 条排队消息',
  'status.moved': '顺序已更新',
  'hint.undo': '清空后 10 秒内可撤销',
  'error.queueChanged': '队列刚刚发生变化，请按最新顺序重试。',
  'error.expired': '撤销时间已过，已清空的消息无法恢复。',
  'error.generic': '操作失败，请稍后重试。',
} as const

export type QueuePlusLocaleKey = keyof typeof zh

export const en: LocaleDictOf<typeof NS> = {
  'panel.label': 'Queue order tools',
  'panel.title': 'Adjust run order',
  'panel.count': '{count} items',
  'panel.hint': 'Drag, or use the arrow buttons',
  'action.expand': 'Expand queue order tools',
  'action.collapse': 'Collapse queue order tools',
  'action.moveUp': 'Move up: {preview}',
  'action.moveDown': 'Move down: {preview}',
  'action.clear': 'Clear all',
  'action.undo': 'Undo ({seconds}s)',
  'status.cleared': 'Cleared {count} queued messages',
  'status.restored': 'Restored {count} queued messages',
  'status.moved': 'Queue order updated',
  'hint.undo': 'Clear all can be undone for 10 seconds',
  'error.queueChanged': 'The queue just changed. Retry from the latest order.',
  'error.expired': 'The undo window expired; cleared messages cannot be restored.',
  'error.generic': 'The operation failed. Try again.',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'queue-plus': QueuePlusLocaleKey
  }
}
