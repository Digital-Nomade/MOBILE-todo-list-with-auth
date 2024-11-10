import { StylesGuide } from "@/constants/StyleGuide"
import { StyleProp, ViewStyle } from "react-native"

interface ContainerProps {
  isViewed: boolean
}

export const styles = {
  container: ({ isViewed }: ContainerProps): StyleProp<ViewStyle> => ({
    width: '100%',
    backgroundColor: StylesGuide.colors.primary,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: isViewed ? 0 : 1,
    borderColor: StylesGuide.colors.dangerLight,
  })
}