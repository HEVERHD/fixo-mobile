import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
}

export default function OperarioLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1e40af',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Mis Órdenes', tabBarIcon: ({ focused }) => <Icon emoji="📋" focused={focused} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} /> }}
      />
    </Tabs>
  )
}
