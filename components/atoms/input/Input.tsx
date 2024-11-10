import { EyeIcon } from "@/components/icons/EyeIcon";
import { StylesGuide } from "@/constants/StyleGuide";
import { ForwardedRef, forwardRef, useState } from "react";
import { Pressable, Text, TextInputProps, View } from "react-native";
import { NativeViewGestureHandlerProps, TextInput } from "react-native-gesture-handler";

type InputProps = TextInputProps & NativeViewGestureHandlerProps & React.RefAttributes<React.ComponentType<any>>

interface Props extends InputProps {
  errorMessage?: string
  contrast?: boolean
}

export const Input = forwardRef(({ errorMessage, contrast, ...props }: Props, ref: ForwardedRef<TextInput>) => {
  const [displayPassword, setDisplayPassword] = useState(props.secureTextEntry)

  const style = props.style as object
  
  return (
    <View style={{ position: 'relative' }}>
      <TextInput
        {...props}
        style={{
          borderBottomColor: StylesGuide.colors.dangerLight,
          borderBottomWidth: 1,
          width: '100%',
          color: StylesGuide.colors.white,
          fontSize: StylesGuide.fontSizes.lg,
          paddingBottom: 8,
          paddingLeft: 4,
          fontWeight: '200',
          ...style
        }}
        ref={ref}
        placeholderTextColor={props.placeholderTextColor ? props.placeholderTextColor : StylesGuide.colors.dangerLight}
        secureTextEntry={displayPassword}
      />
      {errorMessage && (
        <Text
          style={{
            color:  contrast ? StylesGuide.colors.dangerDark : StylesGuide.colors.danger,
            position: 'absolute',
            top: 40,
            fontWeight: contrast ? 700 : 400
          }}
        >
          {errorMessage}
        </Text>
      )}
      {
        props.secureTextEntry && (
          <Pressable 
            style={{ position: 'absolute', right: 4, top: 4 }}
            onPress={() => setDisplayPassword(state => !state)}
          >
            <EyeIcon />
          </Pressable>
        )
      }
    </View>
  )
})
