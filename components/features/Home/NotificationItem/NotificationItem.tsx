import { StylesGuide } from "@/constants/StyleGuide";
import { ToDoNotifications } from "@/types/notificaitons-types";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Pressable, Text } from "react-native";
import { styles } from './NotificationItem.styles';

interface Props {
  notification: ToDoNotifications
}

export function NotificationItem({notification}: Props) {
  return (
    <Pressable
      key={`${notification.id}-${notification.todoId}`}
      style={styles.container({ isViewed: notification.isViewed })}
    >
      <Text style={{ color: StylesGuide.colors.dangerLight, fontSize: StylesGuide.fontSizes.lg, fontWeight: 300 }}>
        {notification.todoTitle}
      </Text>
      <FontAwesome5 name="chevron-right" size={24} color={StylesGuide.colors.dangerLight} />
    </Pressable>
  )
}
