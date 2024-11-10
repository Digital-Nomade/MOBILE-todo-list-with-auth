import { SkeletonList } from "@/components/atoms/skeleton-list/SkeletonList";
import { NotificationItem } from "@/components/features/Home/NotificationItem/NotificationItem";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { StylesGuide } from "@/constants/StyleGuide";
import { notificationsMockData } from "@/mocks/notification-list-mock";
import { ToDoNotifications } from "@/types/notificaitons-types";
import { useEffect, useState } from "react";
import { Text } from "react-native";

export default function Notifications() {
  const [notifications, setNotifications] = useState<ToDoNotifications[]>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // TODO: Clear notifications on the backend.
    setLoading(true)
    setTimeout(() => {
      setNotifications(notificationsMockData)
      setLoading(false)
    }, 1500)
  }, [])

  return (
    <GlobalWrapper>
      <Text
        style={{
          color: StylesGuide.colors.white,
          fontSize: StylesGuide.fontSizes.xl,
          fontWeight: 200,
          marginBottom: 48
        }}
      >
        Notifications
      </Text>
      {
        loading || !notifications
        ? (
          <SkeletonList lines={10} />
        )
        : notifications?.map(notification => (
          <NotificationItem notification={notification} />
        ))
      }
    </GlobalWrapper>
  )
}