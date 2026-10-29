import { useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, View } from 'react-native'
import LottieView from 'lottie-react-native'
import { ANIMATIONS, type AnimationName } from '@/lib/animations'

/**
 * Plays a registered Lottie animation, or renders `fallback` when the file
 * isn't added yet or the user turned on "reduce motion".
 */
export function Animation({
  name, size, loop = true, fallback,
}: {
  name: AnimationName
  size: number
  loop?: boolean
  fallback: ReactNode
}) {
  const reduceMotion = useReduceMotion()
  const source = ANIMATIONS[name]

  if (!source || reduceMotion) return <>{fallback}</>

  // Decorative: hidden from screen readers, the surrounding text carries the meaning
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LottieView source={source} autoPlay loop={loop} resizeMode="contain" style={{ width: size, height: size }} />
    </View>
  )
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce)
    return () => sub.remove()
  }, [])
  return reduce
}
