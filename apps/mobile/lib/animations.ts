/**
 * Lottie animations used across the app, downloaded from LottieFiles into
 * assets/lottie/. Prefer .lottie (smaller) over .json.
 *
 * To add one: drop the file in assets/lottie/ and uncomment its line.
 * A missing entry is fine: components fall back to their static icon.
 */
export type AnimationName = 'login' | 'success' | 'error' | 'empty' | 'scan' | 'waiting'

export const ANIMATIONS: Partial<Record<AnimationName, number>> = {
  // login: require('@/assets/lottie/login.lottie'),      // login header (in place of the logo)
  // success: require('@/assets/lottie/success.lottie'),  // success modals (order, client, invitation…)
  // error: require('@/assets/lottie/error.lottie'),      // error modals
  // empty: require('@/assets/lottie/empty.lottie'),      // empty lists
  // scan: require('@/assets/lottie/scan.lottie'),        // QR scanner frame
  // waiting: require('@/assets/lottie/waiting.lottie'),  // "your account has no company yet"
}
