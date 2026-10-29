import { Tabs } from 'expo-router'
import { ClipboardList, UserRound } from 'lucide-react-native'
import { tabScreenOptions, tabIcon } from '@/components/tabs'

export default function OperarioLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Mis Órdenes', tabBarIcon: tabIcon(ClipboardList) }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: tabIcon(UserRound) }} />
    </Tabs>
  )
}
