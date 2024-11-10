import { StylesGuide } from "@/constants/StyleGuide";
import { ReactNode } from "react";
import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";
import { NativeViewGestureHandlerProps } from "react-native-gesture-handler";
import { Styles } from './Button.styles';
import { buttonTypeMap } from "./constants";

type Variant = 'outlined' | 'fill'
type ButtonType = 'primary' | 'secondary' | 'danger' | 'success' | 'alert' | 'info'
type Button = PressableProps & NativeViewGestureHandlerProps

interface Props extends Button {
  variant: Variant
  rounded?: boolean
  buttonType: ButtonType,
  children: ReactNode | string
  loading?: boolean
  fullWidth?: boolean
  width?: string | number
  loaderIconColor?: string
}

export function Button({
  children,
  variant,
  buttonType,
  rounded = false,
  loading,
  fullWidth = false,
  width = 'fit-content',
  loaderIconColor = StylesGuide.colors.primary,
  ...props
}: Props) {

  const buttonStyles = buttonTypeMap[buttonType][variant]
  const styles = props.style as object

  delete props.style

  return (
    <Pressable
      style={
        Styles.pressable({ 
          buttonStyles,
          styles,
          rounded,
          isOutlined: variant === 'outlined',
          fullWidth,
          width,
        }
      )}
      {...props}
    >
      {
        typeof children === 'string'
        ? (
          <Text style={Styles.text({ buttonStyles })}>
            {children}
          </Text> 
        )
        : children
      }
      {loading &&  (
        <ActivityIndicator
          style={Styles.activityIndicator}
          color={loaderIconColor}
          size="small"
        />
      )}
    </Pressable>
  )
}
