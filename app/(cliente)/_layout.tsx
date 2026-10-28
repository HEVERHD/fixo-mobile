import { Tabs } from 'expo-router'
import { Package, UserRound } from 'lucide-react-native'
import { tabScreenOptions, tabIcon } from '@/components/tabs'

export default function ClienteLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Mis Activos', tabBarIcon: tabIcon(Package) }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: tabIcon(UserRound) }} />
    </Tabs>
  )
}
