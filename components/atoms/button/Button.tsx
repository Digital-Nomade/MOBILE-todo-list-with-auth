import { ReactNode } from "react";
import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";
import { NativeViewGestureHandlerProps } from "react-native-gesture-handler";
import { buttonTypeMap } from "./constants";

type Variant = 'outlined' | 'fill'
type ButtonType = 'primary' | 'secondary' | 'danger' | 'success' | 'alert' | 'info'
type Button = PressableProps & NativeViewGestureHandlerProps

interface Props extends Button {
  variant: Variant
  rounded: boolean
  buttonType: ButtonType,
  children: ReactNode | string
  loading?: boolean
}

export function Button({
  children,
  variant,
  buttonType,
  rounded = false,
  loading,
  ...props
}: Props) {

  const buttonStyles = buttonTypeMap[buttonType][variant]

  return (
    <Pressable
      style={{ 
        ...buttonStyles.viewStyles,
        padding: 8,
        borderRadius: rounded ? 50 : 8,
      }}
      {...props}
    >
      {
        typeof children === 'string'
        ? (
          <Text style={{ ...buttonStyles.textStyles, fontSize: 24, marginHorizontal: 'auto' }}>
            {children}
          </Text> 
        )
        : children
      }
      {loading &&  <ActivityIndicator style={{ position: 'absolute', right: 12, top: 12 }} color={"#0E003A"} size="small" />}
    </Pressable>
  )
}
