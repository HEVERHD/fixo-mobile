import { View, Text, Image } from 'react-native'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('')
}

/** Company logo, or its initials on navy when there is no logo yet. */
export function OrgAvatar({ name, logoUrl, size = 44 }: { name: string; logoUrl?: string | null; size?: number }) {
  const radius = size * 0.28
  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
        className="bg-white border border-gray-100"
        resizeMode="contain"
        accessibilityLabel={`Logo de ${name}`}
      />
    )
  }
  return (
    <View
      style={{ width: size, height: size, borderRadius: radius }}
      className="bg-navy items-center justify-center"
      accessibilityLabel={name}
    >
      <Text className="text-white font-bold" style={{ fontSize: size * 0.36 }}>{initials(name) || '?'}</Text>
    </View>
  )
}
