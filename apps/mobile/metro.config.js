const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// dotLottie animations (assets/lottie/*.lottie) are bundled as assets
config.resolver.assetExts.push('lottie')

module.exports = withNativeWind(config, { input: './global.css' })
