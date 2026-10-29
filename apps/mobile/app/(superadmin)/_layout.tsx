import { Tabs } from 'expo-router'
import { ChartColumn, Building2, UserRound } from 'lucide-react-native'
import { tabScreenOptions, tabIcon } from '@/components/tabs'

export default function SuperAdminLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Resumen', tabBarIcon: tabIcon(ChartColumn) }} />
      <Tabs.Screen name="empresas" options={{ title: 'Empresas', tabBarIcon: tabIcon(Building2) }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: tabIcon(UserRound) }} />
    </Tabs>
  )
}
