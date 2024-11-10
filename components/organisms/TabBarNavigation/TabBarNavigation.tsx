import { StylesGuide } from "@/constants/StyleGuide";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";

export function TabBarNavigation({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        backgroundColor: StylesGuide.colors.primary,
      }}
    >
      {state.routes.map((route, index) => {
        const { options,  } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key
          });
        };

        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              height:74,
              backgroundColor: StylesGuide.colors.primary,
              alignItems: "center",
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            {options?.tabBarIcon && options?.tabBarIcon({size: 2, focused: isFocused, color: '#FFF'})}
            <Text
              style={{
                color: isFocused
                  ? StylesGuide.colors.dangerLight
                  : StylesGuide.colors.secondary,
                fontWeight: isFocused ? "500" : "300",
                marginTop: 4,
                fontSize: StylesGuide.fontSizes.md,
              }}
            >
              {label as any}
            </Text>
          </Pressable>
        );
      })}
    </View>
  )
}