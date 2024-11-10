import { StylesGuide } from "@/constants/StyleGuide";
import { randomUUID } from 'expo-crypto';
import { AnimatePresence } from "moti";
import { Skeleton } from "moti/skeleton";
import { View } from "react-native";

interface Props {
  lines: number
  colors?: string[]
}

const initialColors = [StylesGuide.colors.primaryTransparency, StylesGuide.colors.secondary]

export function SkeletonList({ lines, colors = initialColors }: Props) {
  const iterator = new Array()
  
  for(let i = 0; i < lines; i++ ) {
    iterator.push(
      <View key={randomUUID()} style={{ marginBottom: 16 }} >
        <Skeleton show height={40} width={'100%'} colors={colors} />
      </View>
    )
  }

  return (
    <AnimatePresence>
      {iterator}
    </AnimatePresence>
  )
}