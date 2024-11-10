import Entypo from '@expo/vector-icons/Entypo';
import { Pressable } from "react-native";
import { Styles } from './CheckBox.styles';

interface Props {
  checked: boolean
  onCheck: (value: boolean) => void
  color?: string
  size?: number
}

export function CheckBox({ checked, onCheck, color, size }: Props) {
  return (
    <Pressable style={Styles.pressable({ color, size })} onPress={() => onCheck(!checked)}>
      {checked && <Entypo name="check" size={(size ? size - 8 : 24)} color={color ?? '#777'} />}
    </Pressable>
  )
}