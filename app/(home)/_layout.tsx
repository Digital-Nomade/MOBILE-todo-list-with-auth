import { TabBarNavigation } from '@/components/organisms/TabBarNavigation/TabBarNavigation';
import { StylesGuide } from '@/constants/StyleGuide';
import { useSession } from '@/hooks/useSession';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, Tabs } from 'expo-router';

export default function RootLayout() {
  const { isInitializing, isAuthenticated, user } = useSession()

  if (isInitializing) {
    return null
  }

  if (!isAuthenticated) {
    return <Redirect href='/(auth)' />
  }

  if (user?.status === 'PENDING_VERIFICATION') {
    return <Redirect href='/(auth)/check-email' />
  }

  if (user?.status === 'SUSPENDED') {
    return <Redirect href='/(auth)/account-unavailable' />
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
          tabBarTestID: 'home-tab',
          tabBarIcon: ({ focused,  }) => <Entypo name='home' size={24} color={getFocusedColor(focused)} />
        }}
        
      />
      <Tabs.Screen
        name='(dashboard)'
        options={{
          title: '',
          tabBarTestID: 'dashboard-tab',
          tabBarIcon: ({ focused }) => <MaterialCommunityIcons name='view-dashboard' size={24} color={getFocusedColor(focused)} />
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: '',
          tabBarTestID: 'profile-tab',
          tabBarIcon: ({ focused }) => <FontAwesome name='user-circle-o' size={24} color={getFocusedColor(focused)} />
        }}
      />
    </Tabs>
  )
}