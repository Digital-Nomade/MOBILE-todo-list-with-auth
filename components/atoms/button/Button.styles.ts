import { StyleProp, TextStyle, ViewStyle } from "react-native"

interface CommonButtonStyleProps {
  buttonStyles: any
}

interface ButtonStyleProps extends CommonButtonStyleProps{
  styles: any,
  rounded: boolean,
  isOutlined: boolean,
  fullWidth: boolean,
  width: string | number
}

interface Styles {
  pressable: (props: ButtonStyleProps) => StyleProp<ViewStyle>,
  text: (props: CommonButtonStyleProps) => StyleProp<TextStyle>,
  activityIndicator: StyleProp<ViewStyle>
}

export const Styles: Styles = {
  pressable: ({ buttonStyles, rounded, styles, isOutlined, fullWidth, width }: ButtonStyleProps) => {
    let validWidth: string | number = 'fit-content';

    if (fullWidth) {
      validWidth = '100%'
    } else if (width) {
      validWidth = width
    }

    return ({ 
      ...styles,
      ...buttonStyles.viewStyles,
      padding: 8,
      borderRadius: rounded ? 50 : 8,
      borderWidth: isOutlined ? 1 : 0,
      width: validWidth,
    })
  },
  text: ({ buttonStyles }: CommonButtonStyleProps) => ({
    ...buttonStyles.textStyles,
    fontSize: 24,
    marginHorizontal: 'auto'
  }),
  activityIndicator: {
    position: 'absolute',
    right: 12,
    top: 12
  }
}