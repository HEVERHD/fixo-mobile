import { Tabs } from 'expo-router'
import { LayoutDashboard, ClipboardList, Package, HardHat, UserRound } from 'lucide-react-native'
import { tabScreenOptions, tabIcon } from '@/components/tabs'
import { OrganizationProvider, useOrganization } from '@/components/OrganizationContext'

export default function AdminLayout() {
  return (
    <OrganizationProvider>
      <AdminTabs />
    </OrganizationProvider>
  )
}

function AdminTabs() {
  // Tabs follow the company's business type; `href: null` hides a tab
  const { features } = useOrganization()

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: tabIcon(LayoutDashboard) }} />
      <Tabs.Screen name="ordenes" options={{ title: 'Órdenes', tabBarIcon: tabIcon(ClipboardList) }} />
      <Tabs.Screen
        name="obras"
        options={{ title: 'Obras', tabBarIcon: tabIcon(HardHat), href: features.obras ? undefined : null }}
      />
      <Tabs.Screen
        name="activos"
        options={{ title: 'Equipos', tabBarIcon: tabIcon(Package), href: features.equipos ? undefined : null }}
      />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: tabIcon(UserRound) }} />
    </Tabs>
  )
}
