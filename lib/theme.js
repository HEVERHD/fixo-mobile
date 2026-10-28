// Brand palette taken from assets/Fixo.png. Shared by tailwind.config.js (classes like
// `bg-navy`, `text-primary`) and by components that need raw values (icons, ActivityIndicator).
// CommonJS so tailwind.config.js can require it.
const colors = {
  navy: '#01184E', // logo background, splash, auth screens
  'navy-dark': '#000F36',
  primary: '#0062E6', // brand blue, darkened slightly from the logo so white text passes WCAG AA
  'primary-dark': '#0127C4',
  accent: '#06B9FE', // cyan tip of the "F"
  highlight: '#FEC704', // yellow of the "F"
}

module.exports = { colors }
