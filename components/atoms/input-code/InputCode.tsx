import { StylesGuide } from "@/constants/StyleGuide";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { NativeViewGestureHandlerProps } from "react-native-gesture-handler";
import { Button } from "../button/Button";

type InputRef = React.ForwardRefExoticComponent<TextInputProps & NativeViewGestureHandlerProps & React.RefAttributes<React.ComponentType<any>>>

type InputProps = NativeViewGestureHandlerProps & TextInputProps

interface Props extends InputProps {
  length: number
}

export function InputCode({ length, ...props }: Props) {
  const [countDown, setCountDown] = useState(60)
  const [isResendDisabled, setResendDisabled] = useState(true)
  const inputs = useRef<InputRef[]>([])
  const [code, setCode] = useState([...Array(length)].map(() => ""))

  useEffect(() => {
    const timeout = timer()

    return () => {
      clearTimeout(timeout)
    }
  }, [countDown])

  function timer() {
    if (countDown <= 0) {
      setResendDisabled(false)
    }

    const timeout = setTimeout(() => {
      setCountDown(state => {
        if (state <= 0) {
          setResendDisabled(false)
          clearTimeout(timeout)
          return 0
        }
        return state - 1
      })
    }, 1000)

    return timeout
  }

  function handleResendConfirmationCode() {
    setCountDown(60)
    setResendDisabled(true)
  }

  function processInput(num: string, slot: number) {
    if(/[^0-9]/.test(num)) return

    const newCode = [...code]
    newCode[slot] = num

    setCode(newCode)

    if (slot !== (length - 1)) {
      inputs.current[slot + 1].focus()
    }

    if (newCode.every(num => num !== '')) {
      handleSubmit(newCode.join(""))
    }
  }

  function handleSubmit(newCode: string) {
    console.log(newCode)
  }

  return (
    <View style={{ width: '100%', height: '100%' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        {
          code.map((num, index) => {
            return (
              <TextInput
                key={`index-${num}-${index}`}
                style={{
                  borderColor: StylesGuide.colors.dangerLight,
                  height: 40,
                  width: 40,
                  borderWidth: 1,
                  borderRadius: 4,
                  color: StylesGuide.colors.white,
                  paddingHorizontal: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: StylesGuide.fontSizes.lg
                }}
                autoFocus={!code[0].length && index === 0}
                keyboardType="numeric"
                maxLength={1}
                onChangeText={(num) => processInput(num, index)}
                defaultValue={code[index]}
                ref={ref => inputs.current.push(ref)}
                onKeyPress={(e) => console.log(e.type)}
              />
            )
          })
        }
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between'}}>
        <Pressable onPress={handleResendConfirmationCode} disabled={isResendDisabled}>
          <Text style={{ color: StylesGuide.colors.dangerLight, fontSize: StylesGuide.fontSizes.md, opacity: isResendDisabled ? 0.6 : 1 }}>
            Didn't get the code? <Text style={{ fontWeight: 800, color: StylesGuide.colors.white }}>Resend</Text>
          </Text>
        </Pressable>
        {!!countDown && <Text style={{ color: StylesGuide.colors.dangerLight, fontSize: StylesGuide.fontSizes.md }}>{countDown}s</Text>}
      </View>

      <Button
        style={{ marginTop: '100%' }}
        variant="fill"
        buttonType="secondary"
        rounded
      >
        Confirm account
      </Button>
    </View>
  )
}
