const PREFIX = 'offline.todos.v1'

export function offlineStoreKey(userId: string): string {
  return `${PREFIX}:${userId}`
}

export function localOnlyPreferenceKey(userId: string): string {
  return `${PREFIX}:prefs.localOnly:${userId}`
}
