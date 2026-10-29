import { useState } from 'react'
import { View, Image, TouchableOpacity, Modal, ActivityIndicator, Text } from 'react-native'
import { X, Camera, ImagePlus } from 'lucide-react-native'
import { colors } from '@/lib/theme'

/** Grid of evidence photo thumbnails; a tap opens the photo full screen. Optional remove button. */
export function PhotoGrid({ urls, onRemove }: { urls: string[]; onRemove?: (index: number) => void }) {
  const [open, setOpen] = useState<string | null>(null)
  if (urls.length === 0) return null

  return (
    <>
      <View className="flex-row flex-wrap gap-2">
        {urls.map((url, i) => (
          <TouchableOpacity
            key={url}
            onPress={() => setOpen(url)}
            activeOpacity={0.85}
            className="w-[31%] aspect-square rounded-xl overflow-hidden bg-gray-100"
            accessibilityRole="imagebutton"
            accessibilityLabel={`Foto de evidencia ${i + 1}`}
          >
            <Image source={{ uri: url }} className="w-full h-full" resizeMode="cover" />
            {onRemove && (
              <TouchableOpacity
                onPress={() => onRemove(i)}
                hitSlop={8}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel={`Quitar foto ${i + 1}`}
              >
                <X size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(null)} className="flex-1 bg-black/90 items-center justify-center p-4">
          {open && <Image source={{ uri: open }} className="w-full h-full" resizeMode="contain" />}
          <View className="absolute top-14 right-5 w-10 h-10 rounded-full bg-white/15 items-center justify-center">
            <X size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

/** "Tomar foto" / "Galería" buttons for the report form. */
export function AddPhotoButtons({
  onCamera, onLibrary, busy, disabled,
}: { onCamera: () => void; onLibrary: () => void; busy: boolean; disabled: boolean }) {
  return (
    <View className="flex-row gap-2">
      {[
        { label: 'Tomar foto', icon: Camera, onPress: onCamera },
        { label: 'Galería', icon: ImagePlus, onPress: onLibrary },
      ].map(({ label, icon: Icon, onPress }) => (
        <TouchableOpacity
          key={label}
          onPress={onPress}
          disabled={busy || disabled}
          className={`flex-1 h-12 rounded-2xl border border-dashed border-gray-300 flex-row items-center justify-center ${busy || disabled ? 'opacity-50' : ''}`}
          accessibilityRole="button"
        >
          {busy ? <ActivityIndicator size="small" color={colors.primary} /> : <Icon size={18} color={colors.primary} />}
          <Text className="text-sm font-semibold text-primary ml-2">{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
