import Entypo from '@expo/vector-icons/Entypo';
import { useRouter } from 'expo-router';
import { Pressable, Text } from "react-native";

interface Props {
  label: string
  color: string
}

export default function HeaderBackButton({ label, color }: Props) {
  const router = useRouter()
  
  return (
    <Pressable
      style={{ 
        display: 'flex',
        justifyContent:'flex-start',
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center', 
      }}
      onPress={() => router.back()}
    >
      <Entypo name="chevron-left" size={24} color={color} />
      <Text style={{ color, fontSize: 24 }}>{label}</Text>
    </Pressable>
  )
}
