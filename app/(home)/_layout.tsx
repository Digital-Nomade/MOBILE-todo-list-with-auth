import { TabBarNavigation } from '@/components/organisms/TabBarNavigation/TabBarNavigation';
import { useAppSelector } from '@/config/redux/hooks';
import { StylesGuide } from '@/constants/StyleGuide';
import { useSession } from '@/hooks/useSession';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, Tabs } from 'expo-router';

export default function RootLayout() {
  const { session, signOut } = useSession()
  const { credentials, } = useAppSelector(state => state.auth)

  if (!session) {
    return <Redirect href='/(auth)' />
  }

  if (!credentials.accessToken) {
    signOut()
  }

  function getFocusedColor(isFocused: boolean) {
    return isFocused ? StylesGuide.colors.dangerLight : StylesGuide.colors.secondary
  }

  return (
    <Tabs
      initialRouteName='(main)'
      tabBar={(props) => <TabBarNavigation {...props}/>}
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: { 
          display: 'none',
          position: 'absolute',
        },
      }}
    >
      <Tabs.Screen
        name='(main)'
        options={{ 
          headerShown: false,
          title: '',
          tabBarIcon: ({ focused,  }) => <Entypo name='home' size={24} color={getFocusedColor(focused)} />
        }}
        
      />
      <Tabs.Screen
        name='(dashboard)'
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <MaterialCommunityIcons name='view-dashboard' size={24} color={getFocusedColor(focused)} />
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <FontAwesome name='user-circle-o' size={24} color={getFocusedColor(focused)} />
        }}
      />
    </Tabs>
  )
}