import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import { X, Camera, ScanQrCode } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { parseScannedCode, findAssetIdByCode } from '@/lib/assets'
import { PrimaryButton } from '@/components/AuthLayout'
import { Animation } from '@/components/Animation'

type Notice = { kind: 'checking' } | { kind: 'error'; text: string }

/** Full-screen QR scanner: reads an asset sticker and opens its sheet. */
export default function Escanear() {
  const insets = useSafeAreaInsets()
  const [permission, requestPermission] = useCameraPermissions()
  const [notice, setNotice] = useState<Notice | null>(null)
  // The camera fires many events per second; handle one code at a time
  const busy = useRef(false)

  function showError(text: string) {
    setNotice({ kind: 'error', text })
    setTimeout(() => { busy.current = false; setNotice(null) }, 2500)
  }

  async function onScanned({ data }: BarcodeScanningResult) {
    if (busy.current) return
    busy.current = true

    const code = parseScannedCode(data)
    if (!code) {
      showError('Este código no es una etiqueta de Fixo')
      return
    }

    setNotice({ kind: 'checking' })
    const id = await findAssetIdByCode(code)
    if (!id) {
      showError(`No encontramos el equipo ${code} en tu empresa`)
      return
    }
    router.replace({ pathname: '/activo/[id]', params: { id } })
  }

  const close = (
    <TouchableOpacity
      onPress={() => router.back()}
      hitSlop={10}
      className="w-11 h-11 rounded-full bg-black/40 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel="Cerrar escáner"
    >
      <X size={24} color="#fff" />
    </TouchableOpacity>
  )

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-gray-50 px-6 justify-center" style={{ paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-5">
            <Camera size={36} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">Permite el uso de la cámara</Text>
          <Text className="text-base text-gray-600 text-center mt-3">
            La usamos solo para leer el código QR pegado en cada equipo.
          </Text>
        </View>
        <PrimaryButton
          label={permission.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'}
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
          className="mt-8"
        />
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} className="mt-5 items-center">
          <Text className="text-gray-500 font-medium">Ahora no</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScanned}
      />

      {/* Overlay */}
      <View className="flex-1 justify-between" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }} pointerEvents="box-none">
        <View className="flex-row px-4">{close}</View>

        <View className="items-center" pointerEvents="none">
          <Animation name="scan" size={256} fallback={<View className="w-64 h-64 rounded-3xl border-4 border-white/90" />} />
        </View>

        <View className="px-6 items-center">
          {notice?.kind === 'checking' ? (
            <View className="flex-row items-center bg-black/60 rounded-full px-4 py-2.5">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white font-medium ml-2">Buscando equipo…</Text>
            </View>
          ) : notice?.kind === 'error' ? (
            <View className="bg-red-600 rounded-2xl px-4 py-3">
              <Text className="text-white font-medium text-center">{notice.text}</Text>
            </View>
          ) : (
            <View className="flex-row items-center bg-black/60 rounded-full px-4 py-2.5">
              <ScanQrCode size={18} color="#fff" />
              <Text className="text-white font-medium ml-2">Apunta al QR pegado en el equipo</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
