import { InputCode } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { StylesGuide } from "@/constants/StyleGuide";
import { Text, View } from "react-native";

export default function CodeVerification() {
  return (
    <GlobalWrapper>
      <View style={{ height: '100%' }}>
        <Text
          style={{
            fontSize: StylesGuide.fontSizes.xl,
            color: StylesGuide.colors.dangerLight,
            marginBottom: 32
          }}
        >
          Verify your account
        </Text>
        <Text
          style={{
            color: StylesGuide.colors.dangerLight,
            fontSize: StylesGuide.fontSizes.lg,
            fontWeight: 200,
            marginBottom: 56,
          }}
        >
          Awesome, now just check your email to verify your account!
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <InputCode length={6} />
        </View>
        
        
      </View>
    </GlobalWrapper>
  )
}
