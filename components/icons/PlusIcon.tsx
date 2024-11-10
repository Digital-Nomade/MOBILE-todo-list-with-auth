import Svg, { Line } from "react-native-svg";

export function PlusIcon() {
  return (
    <Svg width="31" height="31" viewBox="0 0 31 31" fill="none">
      <Line x1="15.5" x2="15.5" y2="31" stroke="white"/>
      <Line x1="31" y1="14.5" y2="14.5" stroke="white"/>
    </Svg>
  )
}