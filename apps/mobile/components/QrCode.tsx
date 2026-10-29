import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { colors } from '@/lib/theme'
import { qrSvg } from '@/lib/assets'

/** Square QR code for `value`, drawn as SVG (sharp at any size, same output as printed labels). */
export function QrCode({ value, size = 160 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState<{ value: string; xml: string } | null>(null)

  useEffect(() => {
    let active = true
    qrSvg(value).then(xml => { if (active) setSvg({ value, xml }) })
    return () => { active = false }
  }, [value])

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center" accessibilityLabel={`Código QR ${value}`}>
      {svg?.value === value
        ? <SvgXml xml={svg.xml} width={size} height={size} />
        : <ActivityIndicator color={colors.primary} />}
    </View>
  )
}
