import { Tabs } from 'expo-router'
import { LayoutDashboard, ClipboardList, Package, UserRound } from 'lucide-react-native'
import { tabScreenOptions, tabIcon } from '@/components/tabs'

export default function AdminLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: tabIcon(LayoutDashboard) }} />
      <Tabs.Screen name="ordenes" options={{ title: 'Órdenes', tabBarIcon: tabIcon(ClipboardList) }} />
      <Tabs.Screen name="activos" options={{ title: 'Activos', tabBarIcon: tabIcon(Package) }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: tabIcon(UserRound) }} />
    </Tabs>
  )
}
