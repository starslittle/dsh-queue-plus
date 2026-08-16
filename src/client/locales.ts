import type { LocaleDictOf } from '@deepseek-ai/dsh-client-ui-slots'

export const NS = 'queue-plus' as const

export const zh = {
  'panel.label': '排队消息',
  'panel.count': '{count} 条排队消息',
  'panel.sorting': '调整顺序',
  'panel.list': '排队消息列表',
  'panel.sortList': '按执行顺序排列的消息',
  'action.expand': '展开排队消息',
  'action.collapse': '收起排队消息',
  'action.sort': '排序',
  'action.finishSort': '完成',
  'action.edit': '编辑消息',
  'action.editUnsupported': '含有非文本内容，暂不支持编辑',
  'action.save': '保存修改',
  'action.cancelEdit': '取消编辑',
  'action.remove': '删除消息',
  'action.cancelRemove': '取消',
  'action.confirmRemove': '确认删除',
  'action.steer': '插话发送',
  'action.steerUnavailable': '当前没有正在执行的回答',
  'action.drag': '拖动第 {position} 条消息调整顺序',
  'action.moveUp': '上移第 {position} 条消息',
  'action.moveDown': '下移第 {position} 条消息',
  'action.clear': '删除全部',
  'action.confirmClear': '确认删除',
  'status.confirmClear': '确认删除 {count} 条排队消息？',
  'status.cleared': '已删除 {count} 条排队消息',
  'status.position': '已移至第 {position} 位',
  'hint.sort': '拖动六点手柄，或使用上下箭头',
  'hint.drop': '松开后移至高亮位置',
  'hint.clear': '删除后无法撤销',
  'error.queueChanged': '队列刚刚发生变化，请按最新顺序重试。',
  'error.clearPartial': '已删除 {removed}/{count} 条，其余消息状态已变化。',
  'error.edit': '修改失败，请重试。',
  'error.remove': '删除失败，请重试。',
  'error.steer': '插话发送失败，请重试。',
  'error.generic': '操作失败，请稍后重试。',
} as const

export type QueuePlusLocaleKey = keyof typeof zh

export const en: LocaleDictOf<typeof NS> = {
  'panel.label': 'Queued messages',
  'panel.count': '{count} queued messages',
  'panel.sorting': 'Reordering',
  'panel.list': 'Queued messages',
  'panel.sortList': 'Messages in run order',
  'action.expand': 'Expand queued messages',
  'action.collapse': 'Collapse queued messages',
  'action.sort': 'Sort',
  'action.finishSort': 'Done',
  'action.edit': 'Edit message',
  'action.editUnsupported': 'Messages with non-text content cannot be edited',
  'action.save': 'Save changes',
  'action.cancelEdit': 'Cancel editing',
  'action.remove': 'Remove message',
  'action.cancelRemove': 'Cancel',
  'action.confirmRemove': 'Remove',
  'action.steer': 'Send as steering',
  'action.steerUnavailable': 'There is no running response to steer',
  'action.drag': 'Drag message {position} to reorder',
  'action.moveUp': 'Move message {position} up',
  'action.moveDown': 'Move message {position} down',
  'action.clear': 'Remove all',
  'action.confirmClear': 'Remove all',
  'status.confirmClear': 'Remove {count} queued messages?',
  'status.cleared': 'Removed {count} queued messages',
  'status.position': 'Moved to position {position}',
  'hint.sort': 'Drag the six-dot handle or use the arrow buttons',
  'hint.drop': 'Release to move to the highlighted position',
  'hint.clear': 'Removal cannot be undone',
  'error.queueChanged': 'The queue just changed. Retry from the latest order.',
  'error.clearPartial': 'Removed {removed} of {count}; the remaining messages changed state.',
  'error.edit': 'The message could not be updated. Try again.',
  'error.remove': 'The message could not be removed. Try again.',
  'error.steer': 'The message could not be sent as steering. Try again.',
  'error.generic': 'The operation failed. Try again.',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'queue-plus': QueuePlusLocaleKey
  }
}
