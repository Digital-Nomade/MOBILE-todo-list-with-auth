import { StylesGuide } from '@/constants/StyleGuide'
import { Switch as RNSwitch, SwitchProps as RNSwitchProps } from 'react-native'

interface Props extends RNSwitchProps {
  testID?: string
}

export function Switch({ testID, ...props }: Props) {
  const { colors } = StylesGuide

  return (
    <RNSwitch
      testID={testID}
      trackColor={{ false: '#ffffff44', true: colors.success }}
      thumbColor={colors.white}
      ios_backgroundColor="#ffffff44"
      {...props}
    />
  )
}
