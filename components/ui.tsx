import type { ReactNode } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { LogOut, ChevronRight, type LucideIcon } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { Animation } from '@/components/Animation'
import { useModal } from '@/components/AppModal'

/** Placeholder card for lists with no items. */
export function EmptyState({ icon: Icon, title, message }: { icon: LucideIcon; title: string; message?: string }) {
  return (
    <View className="bg-white rounded-2xl p-6 items-center border border-gray-100">
      <Animation
        name="empty"
        size={120}
        fallback={
          <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
            <Icon size={26} color="#9ca3af" strokeWidth={1.8} />
          </View>
        }
      />
      <Text className="font-semibold text-gray-900">{title}</Text>
      {message && <Text className="text-sm text-gray-500 text-center mt-1">{message}</Text>}
    </View>
  )
}

/** Confirms, then signs out. The root layout redirects to login on session loss. */
export function SignOutButton() {
  const modal = useModal()

  async function handleSignOut() {
    const ok = await modal.confirm({
      title: 'Cerrar sesión',
      message: '¿Deseas salir de Fixo?',
      icon: LogOut,
      actionLabel: 'Salir',
      destructive: true,
    })
    if (ok) await supabase.auth.signOut()
  }

  return (
    <TouchableOpacity
      className="bg-white border border-gray-100 rounded-2xl p-4 flex-row items-center"
      onPress={handleSignOut}
      accessibilityRole="button"
    >
      <View className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center mr-3">
        <LogOut size={18} color="#dc2626" strokeWidth={2} />
      </View>
      <Text className="text-red-600 font-medium flex-1">Cerrar sesión</Text>
      <ChevronRight size={18} color="#fca5a5" />
    </TouchableOpacity>
  )
}

/** Small icon + secondary text line (client, location, date…) inside list cards. */
export function MetaRow({ icon: Icon, children, className = '' }: { icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <View className={`flex-row items-center mt-1 ${className}`}>
      <Icon size={13} color="#9ca3af" strokeWidth={2} />
      <Text className="text-gray-500 text-xs ml-1.5 flex-1" numberOfLines={1}>{children}</Text>
    </View>
  )
}
