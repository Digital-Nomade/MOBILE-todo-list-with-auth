import { StylesGuide } from "@/constants/StyleGuide";
import { AnimatePresence } from "moti";
import { Skeleton } from "moti/skeleton";
import { View } from "react-native";

const colors = [
  StylesGuide.colors.primary,
  StylesGuide.colors.secondary,
]

export function SkeletonTodoForm() {
  return (
    <AnimatePresence>
      <View style={{ width: '100%', marginBottom: 40 }}>
        <Skeleton width={'100%'} height={48} colors={colors} transition={{
          duration: 100
        }}/> 
      </View>
      <View style={{ marginBottom: 40 }}>
        <View style={{ marginBottom: 8 }}>
          <Skeleton
            width={'33%'}
            height={16}
            colors={colors}
            transition={{
              duration: 100
            }}
          />
        </View>
        <View style={{ marginBottom: 16 }}>
          <Skeleton
            width={'100%'}
            height={80}
            colors={colors}
            transition={{
              duration: 100
            }}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
        <View style={{ width: '50%' }}>
          <View style={{ marginBottom: 4}}>
            <Skeleton
              width={'40%'}
              height={20}
              colors={colors}
              transition={{
                duration: 100
              }}
            />
          </View>
          <View>
            <Skeleton width={'78%'} colors={colors} transition={{
                duration: 100
              }}
            />
          </View>
        </View>
        <View style={{ width: '50%' }}>
          <View style={{ marginBottom: 4, alignItems: 'flex-end' }}>
            <Skeleton width={'70%'} height={20} colors={colors} transition={{
              duration: 100
            }}
          />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Skeleton width={'78%'} colors={colors} transition={{
              duration: 100
            }}
          />
          </View>
        </View>
      </View>
    </AnimatePresence>
  )
}
