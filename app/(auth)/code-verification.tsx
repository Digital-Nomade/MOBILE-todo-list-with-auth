import { InputCode } from "@/components/atoms/input-code/InputCode";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { Styles } from "@/constants/StyleGuide";
import { Text, View } from "react-native";

export default function CodeVerification() {
  return (
    <GlobalWrapper>
      <View style={{ height: '100%' }}>
        <Text
          style={{
            fontSize: Styles.fontSizes.xl,
            color: Styles.colors.dangerLight,
            marginBottom: 32
          }}
        >
          Verify your account
        </Text>
        <Text
          style={{
            color: Styles.colors.dangerLight,
            fontSize: Styles.fontSizes.lg,
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
