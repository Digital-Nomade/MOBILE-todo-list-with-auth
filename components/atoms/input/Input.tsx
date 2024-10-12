import { EyeIcon } from "@/components/icons/EyeIcon";
import { Styles } from "@/constants/Colors";
import { ForwardedRef, forwardRef, useState } from "react";
import { Pressable, Text, TextInputProps, View } from "react-native";
import { NativeViewGestureHandlerProps, TextInput } from "react-native-gesture-handler";

type InputProps = TextInputProps & NativeViewGestureHandlerProps & React.RefAttributes<React.ComponentType<any>>

interface Props extends InputProps {
  errorMessage?: string
}

export const Input = forwardRef(({ errorMessage, ...props }: Props, ref: ForwardedRef<TextInput>) => {
  const [displayPassword, setDisplayPassword] = useState(false)

  const style = props.style as object
  
  return (
    <View style={{ position: 'relative' }}>
      <TextInput
        {...props}
        style={{
          borderBottomColor: Styles.colors.dangerLight,
          borderBottomWidth: 1,
          width: '100%',
          color: Styles.colors.white,
          fontSize: Styles.fontSizes.lg,
          paddingBottom: 8,
          paddingLeft: 4,
          fontWeight: '200',
          ...style
        }}
        ref={ref}
        placeholderTextColor={Styles.colors.dangerLight}
        secureTextEntry={displayPassword}
      />
      {errorMessage && (
        <Text
          style={{
            color: Styles.colors.danger,
            position: 'absolute',
            bottom: -20,
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
