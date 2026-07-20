import { StylesGuide } from '@/constants/StyleGuide'
import { TodoSyncState } from '@/types/todo-types'
import { Text, View } from 'react-native'

interface Props {
  syncState: TodoSyncState
}

export function TodoSyncStatusBanner({ syncState }: Props) {
  const { colors, fontSizes } = StylesGuide

  let message: string | null = null

  if (syncState.localOnly) {
    message = 'Local only — todos stay on this device until you choose to upload.'
  } else if (!syncState.isOnline) {
    message = syncState.pendingCount > 0
      ? `Offline — ${syncState.pendingCount} change(s) will sync when you reconnect.`
      : 'Offline — changes are saved on this device.'
  } else if (syncState.coordinatorStatus === 'syncing') {
    message = 'Syncing changes in the background…'
  } else if (syncState.pendingCount > 0) {
    message = `${syncState.pendingCount} change(s) pending sync.`
  } else if (syncState.coordinatorStatus === 'failed') {
    message = syncState.lastError ?? 'Some changes could not be synced yet.'
  }

  if (!message) {
    return null
  }

  return (
    <View
      testID="todo-sync-status-banner"
      style={{
        backgroundColor: '#ffffff22',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
      }}
    >
      <Text style={{ color: colors.dangerLight, fontSize: fontSizes.sm }}>
        {message}
      </Text>
    </View>
  )
}
