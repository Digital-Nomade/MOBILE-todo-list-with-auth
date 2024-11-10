import { StyleProp, ViewStyle } from "react-native"

interface ButtonStyleProps {
  color?: string,
  size?: number
}

export const Styles = {
  pressable: ({ color, size }: ButtonStyleProps): StyleProp<ViewStyle>  => ({
    borderColor: color ?? '#777',
    borderRadius: 8,
    borderWidth: 1,
    width: size ?? 32,
    height: size ?? 32,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  })
}