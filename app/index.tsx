import { View, ActivityIndicator } from 'react-native'

// Root index — _layout.tsx handles redirect based on session/role
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#1e40af" />
    </View>
  )
}
